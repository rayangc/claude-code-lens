/**
 * Parses <teammate-message> XML tags from user messages in team sessions.
 */

export interface TeammateMessage {
  teammateId: string;
  content: string;
  isJson: boolean;
  jsonType?: string;
  jsonData?: Record<string, unknown>;
}

const TEAMMATE_RE = /<teammate-message\s+teammate_id="([^"]+)"[^>]*>([\s\S]*?)<\/teammate-message>/;
const TEAMMATE_RE_GLOBAL = /<teammate-message\s+teammate_id="([^"]+)"[^>]*>([\s\S]*?)<\/teammate-message>/g;

/**
 * Check if a message text contains teammate-message XML.
 */
export function containsTeammateMessage(text: string): boolean {
  return TEAMMATE_RE.test(text);
}

/**
 * Parse the first <teammate-message> from a message text.
 * Returns null if no teammate message is found.
 */
export function parseTeammateMessage(text: string): TeammateMessage | null {
  const match = text.match(TEAMMATE_RE);
  if (!match) return null;

  const teammateId = match[1];
  const content = match[2].trim();

  let isJson = false;
  let jsonType: string | undefined;
  let jsonData: Record<string, unknown> | undefined;

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && typeof parsed.type === 'string') {
      isJson = true;
      jsonType = parsed.type;
      jsonData = parsed;
    }
  } catch {
    // Not JSON — that's fine, it's a text message
  }

  return { teammateId, content, isJson, jsonType, jsonData };
}

/**
 * Extract all unique teammate IDs from a message text.
 */
export function extractTeammateIds(text: string): string[] {
  const ids = new Set<string>();
  let match;
  while ((match = TEAMMATE_RE_GLOBAL.exec(text)) !== null) {
    ids.add(match[1]);
  }
  // Reset regex lastIndex for reuse
  TEAMMATE_RE_GLOBAL.lastIndex = 0;
  return Array.from(ids);
}
