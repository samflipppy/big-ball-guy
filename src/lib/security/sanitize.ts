/**
 * XSS sanitization utilities.
 *
 * Provides functions to sanitize user input and prevent
 * cross-site scripting (XSS) attacks across the application.
 */

// --- HTML Entity Encoding ---

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

/**
 * Encode HTML special characters to their entity equivalents.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);
}

// --- Text Sanitization ---

/**
 * Strip all HTML tags from input and encode remaining entities.
 * Suitable for plain text fields like labels and display names.
 */
export function sanitizeText(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // Remove script tags and their content first
  sanitized = sanitized.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove all remaining HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Encode HTML entities in the remaining text
  sanitized = escapeHtml(sanitized);

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

// --- Play Name Sanitization ---

const PLAY_NAME_MAX_LENGTH = 100;
const PLAY_NAME_PATTERN = /^[a-zA-Z0-9\s\-_.()]+$/;

/**
 * Validate and sanitize a play name.
 * Allows alphanumeric characters, spaces, hyphens, underscores, dots, and parentheses.
 * Maximum 100 characters.
 */
export function sanitizePlayName(name: string): string {
  if (!name) return '';

  // Trim whitespace
  let sanitized = name.trim();

  // Strip any HTML tags first
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove characters not matching the allowed pattern
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.()]/g, '');

  // Collapse multiple spaces into one
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Truncate to max length
  if (sanitized.length > PLAY_NAME_MAX_LENGTH) {
    sanitized = sanitized.substring(0, PLAY_NAME_MAX_LENGTH);
  }

  return sanitized;
}

/**
 * Check if a play name is valid (without sanitizing).
 */
export function isValidPlayName(name: string): boolean {
  if (!name || name.trim().length === 0) return false;
  const trimmed = name.trim();
  if (trimmed.length > PLAY_NAME_MAX_LENGTH) return false;
  return PLAY_NAME_PATTERN.test(trimmed);
}

// --- Notes Sanitization ---

// Tags allowed in notes for basic formatting
const ALLOWED_TAGS = new Set([
  'b', 'i', 'u', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li',
]);

/**
 * Sanitize notes content. Allows basic formatting tags but strips
 * script tags, event handlers, and dangerous attributes.
 */
export function sanitizeNotes(notes: string): string {
  if (!notes) return '';

  let sanitized = notes;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove event handler attributes (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, '');

  // Remove data: URLs in attributes
  sanitized = sanitized.replace(/data\s*:[^;]*;base64/gi, '');

  // Strip disallowed tags but keep their text content
  sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    const tagLower = tag.toLowerCase();
    if (ALLOWED_TAGS.has(tagLower)) {
      // For allowed tags, strip all attributes except the tag itself
      if (match.startsWith('</')) {
        return `</${tagLower}>`;
      }
      // Self-closing tags like <br>
      if (tagLower === 'br') {
        return '<br>';
      }
      return `<${tagLower}>`;
    }
    // Strip disallowed tags entirely
    return '';
  });

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized.trim();
}

// --- Search Query Sanitization ---

/**
 * Sanitize a search query to prevent injection attacks.
 * Strips special characters that could be used for SQL/NoSQL injection
 * or search engine manipulation.
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';

  let sanitized = query;

  // Strip HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove SQL-like injection patterns
  sanitized = sanitized.replace(/['";\\]/g, '');

  // Remove common SQL keywords used in injection
  sanitized = sanitized.replace(
    /\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|EXECUTE)\b/gi,
    '',
  );

  // Remove SQL comment markers
  sanitized = sanitized.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Trim and collapse whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Limit length to prevent DoS via regex
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }

  return sanitized;
}
