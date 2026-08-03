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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const accountId = Deno.env.get("R2_ACCOUNT_ID");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucket = Deno.env.get("R2_BUCKET");
    const publicUrl = (Deno.env.get("R2_PUBLIC_URL") || "").replace(/\/$/, "");

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
      return json(
        { error: "R2 chưa được cấu hình. Cần R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL." },
        500,
      );
    }

    // Require an authenticated user
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const client = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    });
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}`;

    const contentType = req.headers.get("content-type") || "";

    // JSON body => delete action
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.action !== "delete" || !body.key) return json({ error: "Invalid request" }, 400);
      const res = await client.fetch(`${endpoint}/${body.key}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        return json({ error: `Delete failed: ${res.status}` }, 500);
      }
      return json({ success: true });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string | null) ?? "uploads";
    if (!file) return json({ error: "Missing file" }, 400);

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return json({ error: "Chỉ hỗ trợ file hình ảnh hoặc video" }, 400);
    }
    if (file.size > 20 * 1024 * 1024) {
      return json({ error: "File vượt quá 20MB" }, 400);
    }

    const ext = (file.name.split(".").pop() || file.type.split("/")[1] || "bin")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "");
    const key = `${safeFolder}/${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const put = await client.fetch(`${endpoint}/${key}`, {
      method: "PUT",
      body: await file.arrayBuffer(),
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });

    if (!put.ok) {
      const text = await put.text();
      console.error("R2 upload failed", put.status, text);
      return json({ error: `Upload thất bại (${put.status})` }, 500);
    }

    return json({ url: `${publicUrl}/${key}`, key });
  } catch (e) {
    console.error("r2-upload error", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
