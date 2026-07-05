import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_stories",
  title: "List stories",
  description: "List approved published stories from Huy's blog, most recent first.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max stories to return (default 10)."),
    topic: z.string().optional().describe("Optional topic slug filter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, topic }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let q = supabase
      .from("posts")
      .select("id, title, slug, excerpt, topic, created_at, cover_image")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (topic) q = q.eq("topic", topic);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { stories: data ?? [] },
    };
  },
});
