/**
 * Parse a fetch Response body as JSON. Returns null if the body is not valid JSON.
 */
export async function parseResponseJson<T>(response: Response): Promise<T | null> {
  const rawText = await response.text();
  try {
    return JSON.parse(rawText) as T;
  } catch {
    return null;
  }
}
