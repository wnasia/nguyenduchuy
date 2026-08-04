import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const STORAGE_RE = /https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s"'<>)\\]+/gi;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const accountId = Deno.env.get("R2_ACCOUNT_ID");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucket = Deno.env.get("R2_BUCKET");
    const publicUrl = (Deno.env.get("R2_PUBLIC_URL") || "").replace(/\/$/, "");
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
      return json({ error: "R2 chưa được cấu hình đầy đủ." }, 500);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Access control: internal migration token OR an authenticated admin user
    const migrateToken = Deno.env.get("MIGRATE_ADMIN_TOKEN");
    const providedToken = req.headers.get("x-migrate-token");
    const tokenOk = !!migrateToken && providedToken === migrateToken;

    if (!tokenOk) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const asUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user } } = await asUser.auth.getUser();
      if (!user) return json({ error: "Unauthorized" }, 401);
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "Forbidden" }, 403);
    }

    const client = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}`;
    const cache = new Map<string, string>();
    const errors: string[] = [];
    let migrated = 0;

    const moveOne = async (url: string): Promise<string> => {
      if (cache.has(url)) return cache.get(url)!;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`download ${res.status} ${url}`);
      const contentType = res.headers.get("content-type") || "application/octet-stream";
      const bytes = new Uint8Array(await res.arrayBuffer());
      const name = decodeURIComponent(new URL(url).pathname.split("/").pop() || "file");
      const ext = (name.split(".").pop() || contentType.split("/")[1] || "bin")
        .toLowerCase().replace(/[^a-z0-9]/g, "");
      const key = `migrated/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const put = await client.fetch(`${endpoint}/${key}`, {
        method: "PUT",
        body: bytes,
        headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
      });
      if (!put.ok) throw new Error(`upload ${put.status} ${await put.text()}`);
      const newUrl = `${publicUrl}/${key}`;
      cache.set(url, newUrl);
      migrated++;
      return newUrl;
    };

    const migrateColumn = async (table: string, column: string) => {
      const { data, error } = await admin
        .from(table)
        .select(`id,${column}`)
        .like(column, "%supabase.co/storage%");
      if (error) { errors.push(`${table}.${column}: ${error.message}`); return; }
      for (const row of data ?? []) {
        const value = (row as Record<string, string>)[column];
        if (!value) continue;
        try {
          const urls = [...new Set(value.match(STORAGE_RE) ?? [])];
          let next = value;
          for (const u of urls) next = next.split(u).join(await moveOne(u));
          if (next !== value) {
            const { error: upErr } = await admin
              .from(table)
              .update({ [column]: next })
              .eq("id", (row as { id: string }).id);
            if (upErr) errors.push(`${table}.${column} #${(row as { id: string }).id}: ${upErr.message}`);
          }
        } catch (e) {
          errors.push(`${table}.${column} #${(row as { id: string }).id}: ${e instanceof Error ? e.message : e}`);
        }
      }
    };

    const targets: Array<[string, string]> = [
      ["gallery_images", "image_url"],
      ["homepage_banners", "image_url"],
      ["posts", "thumbnail_url"],
      ["posts", "media_url"],
      ["posts", "content"],
      ["profiles", "avatar_url"],
      ["youtube_videos", "thumbnail_url"],
    ];
    for (const [table, column] of targets) await migrateColumn(table, column);

    return json({ success: errors.length === 0, migrated_files: migrated, errors });
  } catch (e) {
    console.error("storage-migrate error", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
