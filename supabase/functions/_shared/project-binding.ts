/** Exact host binding for a function that can write consequential state. */
export function matchesExpectedSupabaseProject(url: string, expectedProjectRef: string): boolean {
  if (!expectedProjectRef || !/^[a-z0-9]{20}$/.test(expectedProjectRef)) return false;
  try {
    return new URL(url).hostname === `${expectedProjectRef}.supabase.co`;
  } catch {
    return false;
  }
}
