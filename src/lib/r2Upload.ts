import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file to Cloudflare R2 through the `r2-upload` edge function.
 * Returns the public CDN URL and the object key.
 */
export async function uploadToR2(
  file: File,
  folder: string = "uploads",
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const { data, error } = await supabase.functions.invoke("r2-upload", {
    body: formData,
  });

  if (error) throw new Error(error.message || "Upload failed");
  if (!data?.url) throw new Error(data?.error || "Upload failed");

  return { url: data.url as string, key: data.key as string };
}

/** Delete an object from R2 by key (or full public URL). */
export async function deleteFromR2(keyOrUrl: string): Promise<void> {
  let key = keyOrUrl;
  if (/^https?:\/\//.test(keyOrUrl)) {
    try {
      key = new URL(keyOrUrl).pathname.replace(/^\/+/, "");
    } catch {
      return;
    }
  }
  if (!key) return;
  await supabase.functions.invoke("r2-upload", {
    body: { action: "delete", key },
  });
}
