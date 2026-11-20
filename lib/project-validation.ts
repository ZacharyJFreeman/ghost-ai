export const DEFAULT_PROJECT_NAME = "Untitled Project"

interface NameInput {
  name?: unknown
}

type ParseResult = { ok: true; name: string } | { ok: false; error: string }

function readName(body: unknown): unknown | undefined {
  if (body === undefined || body === null) return undefined
  if (typeof body !== "object") return null
  return (body as NameInput).name
}

// Create: a missing or blank name falls back to the default.
export function parseCreateName(body: unknown): ParseResult {
  const name = readName(body)
  if (name === null) return { ok: false, error: "Invalid request body" }
  if (name === undefined) return { ok: true, name: DEFAULT_PROJECT_NAME }
  if (typeof name !== "string") return { ok: false, error: "name must be a string" }
  return { ok: true, name: name.trim() || DEFAULT_PROJECT_NAME }
}

// Rename: a non-empty string name is required.
export function parseRenameName(body: unknown): ParseResult {
  const name = readName(body)
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, error: "name must be a non-empty string" }
  }
  return { ok: true, name: name.trim() }
}
