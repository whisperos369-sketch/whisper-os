/**
 * Wrapper around fetch that throws on non-2xx responses and returns JSON when possible.
 */
export async function _fetch(url: string, init: RequestInit = {}) {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
