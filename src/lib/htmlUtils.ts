/**
 * Decode HTML entities to proper UTF-8 characters
 * Handles Vietnamese diacritics and special characters
 */
export const decodeHtmlEntities = (html: string): string => {
  if (!html) return '';
  
  // Use textarea trick for browser-native decoding
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
};

/**
 * Strip HTML tags and decode entities for plain text display
 * Used for excerpts and previews
 */
export const stripHtmlAndDecode = (html: string): string => {
  if (!html) return '';
  
  // First decode HTML entities
  const decoded = decodeHtmlEntities(html);
  
  // Then strip HTML tags
  const tmp = document.createElement('div');
  tmp.innerHTML = decoded;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Parse post content JSON and decode all text fields
 */
export interface ParsedContent {
  story: string;
  imageLinks?: string[];
  videoLinks?: string[];
  tags?: string[];
}

export const parsePostContent = (content: string): ParsedContent => {
  if (!content) {
    return { story: '', imageLinks: [], videoLinks: [], tags: [] };
  }
  
  try {
    const parsed = JSON.parse(content);
    return {
      story: decodeHtmlEntities(parsed.story || ''),
      imageLinks: parsed.imageLinks || [],
      videoLinks: parsed.videoLinks || [],
      tags: parsed.tags || []
    };
  } catch {
    // If not valid JSON, treat as plain text/HTML
    return {
      story: decodeHtmlEntities(content),
      imageLinks: [],
      videoLinks: [],
      tags: []
    };
  }
};

/**
 * Get plain text excerpt from post content
 */
export const getExcerpt = (content: string, maxLength: number = 120): string => {
  const parsed = parsePostContent(content);
  const text = stripHtmlAndDecode(parsed.story);
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};
