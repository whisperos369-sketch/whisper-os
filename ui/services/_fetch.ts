/**
 * Lightweight wrapper around the Fetch API that returns JSON when possible
 * and throws on non-2xx responses.
 */
export async function _fetch(input: RequestInfo | URL, init?: RequestInit): Promise<any> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export default _fetch;
