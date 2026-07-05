import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "search_stories",
  title: "Search stories",
  description: "Search approved stories by keyword in title or excerpt.",
  inputSchema: {
    query: z.string().min(1).describe("Search keyword."),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const like = `%${query}%`;
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, excerpt, topic, created_at")
      .eq("status", "approved")
      .or(`title.ilike.${like},excerpt.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { results: data ?? [] },
    };
  },
});
