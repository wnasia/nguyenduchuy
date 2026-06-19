// Edge function: fetches the tax-debt source file (CSV/XLSX) from a public Google Drive
// link configured in app_settings.tax_debt_source_url, parses it server-side, and returns
// JSON to the browser (avoiding CORS issues with drive.google.com).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  // Patterns:
  //   https://drive.google.com/file/d/<ID>/view
  //   https://drive.google.com/open?id=<ID>
  //   https://drive.google.com/uc?id=<ID>
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  // Google Sheets export CSV pattern: just return null and use url directly
  return null;
}

function buildFetchUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  // Google Sheets edit/view URLs serve an HTML app page, not spreadsheet data.
  // Convert them to a real CSV export URL and keep the selected sheet gid.
  if (trimmed.includes("docs.google.com/spreadsheets")) {
    if (trimmed.includes("/pub?") || trimmed.includes("output=csv")) {
      return trimmed;
    }
    const spreadsheetId = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    const gid = trimmed.match(/[?#&]gid=([0-9]+)/)?.[1] || "0";
    if (spreadsheetId) {
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    }
  }

  if (
    trimmed.includes("output=csv") ||
    trimmed.endsWith(".csv") ||
    trimmed.endsWith(".xlsx")
  ) {
    return trimmed;
  }
  const id = extractDriveFileId(trimmed);
  if (id) {
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }
  return trimmed;
}

function getSheetInfo(rawUrl: string): { spreadsheetId: string; gid: string } | null {
  const spreadsheetId = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  if (!spreadsheetId) return null;
  return {
    spreadsheetId,
    gid: rawUrl.match(/[?#&]gid=([0-9]+)/)?.[1] || "0",
  };
}

function escapeSheetQueryValue(value: string): string {
  return value.replace(/[\\']/g, " ").trim();
}

function buildSheetQueryUrl(rawUrl: string, sheetQuery: string): string | null {
  const info = getSheetInfo(rawUrl);
  if (!info) return null;
  return `https://docs.google.com/spreadsheets/d/${info.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${info.gid}&tq=${encodeURIComponent(sheetQuery)}`;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }
  out.push(cur.trim());
  return out;
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]).map((cell, index) => cell || `Cột ${index + 1}`);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ""]));
  });
}

async function fetchSheetRows(sourceUrl: string, query: string, page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  const cleanQuery = escapeSheetQueryValue(query);
  const upperQuery = cleanQuery.toLocaleUpperCase("vi-VN");
  const where = cleanQuery
    ? ` where B contains '${cleanQuery}' or C contains '${cleanQuery}' or C contains '${upperQuery}'`
    : "";
  const select =
    "select A,B,C,D,E" +
    where +
    ` limit ${pageSize} offset ${offset} ` +
    "label A 'STT', B 'MST', C 'Tên Người nộp thuế', D 'Trạng thái MST', E 'Cơ quan thuế quản lý'";
  const countQuery = `select count(A)${where}`;
  const rowsUrl = buildSheetQueryUrl(sourceUrl, select);
  const countUrl = buildSheetQueryUrl(sourceUrl, countQuery);
  if (!rowsUrl || !countUrl) throw new Error("Link Google Sheets không hợp lệ");

  const [rowsRes, countRes] = await Promise.all([fetch(rowsUrl), fetch(countUrl)]);
  if (!rowsRes.ok) throw new Error(`Không truy vấn được Google Sheets (HTTP ${rowsRes.status})`);
  if (!countRes.ok) throw new Error(`Không đếm được dữ liệu Google Sheets (HTTP ${countRes.status})`);
  const rows = parseCsvText(await rowsRes.text());
  const countRows = parseCsvText(await countRes.text());
  const matchedCount = Number(Object.values(countRows[0] ?? {})[0] ?? rows.length) || rows.length;
  return { rows, count: matchedCount, matchedCount };
}

async function parseCsvStream(
  stream: ReadableStream<Uint8Array>,
  query: string,
  page: number,
  pageSize: number,
) {
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  const normalizedQuery = normalizeText(query.trim());
  let header: string[] | null = null;
  let leftover = "";
  let sourceCount = 0;
  let matchedCount = 0;
  const rows: Record<string, string>[] = [];
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const shouldCountAll = !query.trim();
  let doneCollecting = false;

  const consumeLine = (rawLine: string) => {
    const line = rawLine.replace(/\r$/, "");
    if (!line.trim()) return;
    const cells = parseCsvLine(line);
    if (!header) {
      const normalized = cells.map(normalizeText);
      const looksLikeHeader =
        normalized.some((cell) => cell === "mst" || cell.includes("ma so thue")) &&
        normalized.some((cell) => cell.includes("ten") || cell.includes("nguoi nop thue"));
      if (looksLikeHeader) {
        header = cells.map((cell, index) => cell || `Cột ${index + 1}`);
      }
      return;
    }

    const row = Object.fromEntries(
      header.map((name, index) => [name, cells[index] ?? ""]),
    ) as Record<string, string>;
    if (!Object.values(row).some((value) => value.trim())) return;
    sourceCount++;
    const matches =
      !normalizedQuery ||
      Object.values(row).some((value) => normalizeText(value).includes(normalizedQuery));
    if (!matches) return;
    if (matchedCount >= start && matchedCount < end) rows.push(row);
    matchedCount++;
    if (!shouldCountAll && rows.length >= pageSize) doneCollecting = true;
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const parts = (leftover + value).split("\n");
    leftover = parts.pop() ?? "";
    for (const part of parts) consumeLine(part);
    if (doneCollecting) {
      await reader.cancel();
      break;
    }
  }
  if (!doneCollecting) consumeLine(leftover);
  return { rows, count: sourceCount, matchedCount };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let query = url.searchParams.get("q") || "";
    let page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
    let pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("pageSize") || "25") || 25),
    );
    if (req.method !== "GET") {
      const body = await req.json().catch(() => ({}));
      query = String(body.q ?? body.query ?? query);
      page = Math.max(1, Number(body.page ?? page) || 1);
      pageSize = Math.min(100, Math.max(1, Number(body.pageSize ?? pageSize) || 25));
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: setting, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "tax_debt_source_url")
      .maybeSingle();

    if (error) throw error;

    const sourceUrl = (setting?.value || "").trim();
    if (!sourceUrl) {
      return new Response(
        JSON.stringify({
          configured: false,
          rows: [],
          message: "Chưa cấu hình link nguồn dữ liệu",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    if (sourceUrl.includes("docs.google.com/spreadsheets")) {
      const { rows, count, matchedCount } = await fetchSheetRows(
        sourceUrl,
        query,
        page,
        pageSize,
      );
      return new Response(
        JSON.stringify({
          configured: true,
          rows,
          count,
          matchedCount,
          page,
          pageSize,
          fetchedAt: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=600",
          },
          status: 200,
        },
      );
    }

    const fetchUrl = buildFetchUrl(sourceUrl);
    const res = await fetch(fetchUrl, { redirect: "follow" });
    if (!res.ok) {
      throw new Error(`Không tải được file từ nguồn (HTTP ${res.status})`);
    }
    if (!res.body) throw new Error("Nguồn dữ liệu không có nội dung để đọc");
    const parsed = await parseCsvStream(res.body, query, page, pageSize);
    const { rows, count, matchedCount } = parsed;

    return new Response(
      JSON.stringify({
        configured: true,
        rows,
        count,
        matchedCount,
        page,
        pageSize,
        fetchedAt: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          // Cache 10 minutes on CDN/edge to reduce Drive hits.
          "Cache-Control": "public, max-age=600",
        },
        status: 200,
      },
    );
  } catch (err) {
    console.error("tax-debt-fetch error:", err);
    return new Response(
      JSON.stringify({
        configured: true,
        rows: [],
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
