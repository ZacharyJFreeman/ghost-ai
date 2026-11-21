// Client-side only: shared fetch wrapper for the app's JSON API.
// Throws an Error carrying the API's `error` message on any non-2xx response.

export const GENERIC_ERROR = "Something went wrong. Please try again."

export async function request<T extends { error?: string }>(
  url: string,
  method = "GET",
  body?: unknown
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = (await response.json().catch(() => ({}))) as T
  if (!response.ok) throw new Error(data.error ?? GENERIC_ERROR)
  return data
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : GENERIC_ERROR
}
