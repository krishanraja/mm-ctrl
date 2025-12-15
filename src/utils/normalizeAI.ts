/**
 * Normalizes AI capitalization in text content.
 * Replaces inconsistent variations like "ai", "Ai" with proper "AI".
 * 
 * This is needed because AI-generated content sometimes has inconsistent
 * capitalization of the term "AI".
 */
export function normalizeAI(text: string | null | undefined): string {
  if (!text) return '';
  
  // Replace standalone "ai" or "Ai" with "AI"
  // Uses word boundaries to avoid replacing in words like "contains", "maintain", "against"
  return text
    // Handle hyphenated terms FIRST like "ai-powered", "Ai-Emerging" -> "AI-powered", "AI-Emerging"
    .replace(/\b[Aa][Ii]-/g, 'AI-')
    // Handle standalone "ai" or "Ai" (case insensitive)
    .replace(/\bai\b/gi, 'AI')
    // Handle terms like "AI's" properly
    .replace(/\bAi's\b/g, "AI's")
    // Final cleanup: any remaining "Ai" followed by word boundary
    .replace(/\bAi\b/g, 'AI');
}

/**
 * Normalizes AI capitalization in an object's string properties recursively.
 * Useful for normalizing entire data objects from the database.
 */
export function normalizeAIInObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return normalizeAI(obj) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => normalizeAIInObject(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = normalizeAIInObject((obj as any)[key]);
      }
    }
    return result as T;
  }
  
  return obj;
}

