import { defineMcp } from "@lovable.dev/mcp-js";
import listStories from "./tools/list-stories";
import getStory from "./tools/get-story";
import searchStories from "./tools/search-stories";

export default defineMcp({
  name: "huy-blog-mcp",
  title: "Huy's Blog MCP",
  version: "0.1.0",
  instructions:
    "Access to Huy's blog content. Use `list_stories` to browse recent posts, `search_stories` to search by keyword, and `get_story` to fetch full content by id or slug.",
  tools: [listStories, getStory, searchStories],
});
