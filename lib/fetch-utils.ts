/**
 * Utility for making fetch requests with an automatic AbortController timeout.
 * Prevents network requests from hanging indefinitely on mobile / slow network connections.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const { timeoutMs = 4000, ...fetchOptions } = init || {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...fetchOptions,
      signal: fetchOptions.signal || controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}
