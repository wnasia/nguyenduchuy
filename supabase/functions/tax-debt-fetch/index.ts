// Edge function: fetches the tax-debt source file (CSV/XLSX) from a public Google Drive
// link configured in app_settings.tax_debt_source_url, parses it server-side, and returns
// JSON to the browser (avoiding CORS issues with drive.google.com).
import { createClient } from "npm:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

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
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const parts = (leftover + value).split("\n");
    leftover = parts.pop() ?? "";
    for (const part of parts) consumeLine(part);
  }
  consumeLine(leftover);
  return { rows, count: sourceCount, matchedCount };
}

async function parseFile(buffer: ArrayBuffer, filenameHint: string) {
  // XLSX library handles both CSV and XLSX/XLS via SheetJS.
  const isCsv =
    filenameHint.includes("format=csv") ||
    filenameHint.includes("output=csv") ||
    filenameHint.toLowerCase().endsWith(".csv");
  const wb = isCsv
    ? XLSX.read(new TextDecoder("utf-8").decode(buffer), {
        type: "string",
        codepage: 65001,
      })
    : XLSX.read(new Uint8Array(buffer), { type: "array", codepage: 65001 });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  const headerIndex = matrix.findIndex((row) => {
    const normalized = row.map((cell) => String(cell).toLowerCase());
    return (
      normalized.some((cell) => cell.includes("mst") || cell.includes("mã số thuế")) &&
      normalized.some((cell) => cell.includes("tên") || cell.includes("người nộp thuế"))
    );
  });
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: headerIndex >= 0 ? headerIndex : 0,
    defval: "",
    raw: false,
  });
  return rows.filter((row) =>
    Object.values(row).some((value) => String(value ?? "").trim() !== ""),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";
    const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("pageSize") || "25") || 25),
    );
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

    const fetchUrl = buildFetchUrl(sourceUrl);
    const res = await fetch(fetchUrl, { redirect: "follow" });
    if (!res.ok) {
      throw new Error(`Không tải được file từ nguồn (HTTP ${res.status})`);
    }
    const isCsv =
      fetchUrl.includes("format=csv") ||
      fetchUrl.includes("output=csv") ||
      fetchUrl.toLowerCase().endsWith(".csv");
    const parsed = isCsv && res.body
      ? await parseCsvStream(res.body, query, page, pageSize)
      : { rows: await parseFile(await res.arrayBuffer(), fetchUrl), count: 0, matchedCount: 0 };
    const rows = isCsv ? parsed.rows : parsed.rows.slice((page - 1) * pageSize, page * pageSize);
    const count = isCsv ? parsed.count : parsed.rows.length;
    const matchedCount = isCsv
      ? parsed.matchedCount
      : parsed.rows.filter((row) =>
          !query.trim() ||
          Object.values(row).some((value) => normalizeText(value).includes(normalizeText(query))),
        ).length;

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
