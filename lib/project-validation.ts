export const DEFAULT_PROJECT_NAME = "Untitled Project"

const MAX_ID_LENGTH = 100
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

interface CreateBody {
  name?: unknown
  id?: unknown
}

type CreateResult =
  | { ok: true; name: string; id?: string }
  | { ok: false; error: string }

type NameResult = { ok: true; name: string } | { ok: false; error: string }

function readField(body: unknown, key: keyof CreateBody): unknown | null {
  if (body === undefined || body === null) return undefined
  if (typeof body !== "object") return null
  return (body as CreateBody)[key]
}

// Create: a missing or blank name falls back to the default. An optional
// client-supplied `id` (the Liveblocks room ID) must be a lowercase slug.
export function parseCreateBody(body: unknown): CreateResult {
  const name = readField(body, "name")
  const id = readField(body, "id")
  if (name === null || id === null) return { ok: false, error: "Invalid request body" }

  if (name !== undefined && typeof name !== "string") {
    return { ok: false, error: "name must be a string" }
  }
  const resolvedName = (name as string | undefined)?.trim() || DEFAULT_PROJECT_NAME

  if (id === undefined) return { ok: true, name: resolvedName }
  if (typeof id !== "string" || id.length > MAX_ID_LENGTH || !ID_PATTERN.test(id)) {
    return { ok: false, error: "id must be a lowercase slug" }
  }
  return { ok: true, name: resolvedName, id }
}

// Rename: a non-empty string name is required.
export function parseRenameName(body: unknown): NameResult {
  const name = readField(body, "name")
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, error: "name must be a non-empty string" }
  }
  return { ok: true, name: name.trim() }
}

const MAX_EMAIL_LENGTH = 254
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type EmailResult = { ok: true; email: string } | { ok: false; error: string }

// Invite: a valid email address, normalized to lowercase.
export function parseInviteEmail(body: unknown): EmailResult {
  const email =
    body && typeof body === "object" ? (body as { email?: unknown }).email : undefined
  if (typeof email !== "string") return { ok: false, error: "email must be a string" }

  const normalized = email.trim().toLowerCase()
  if (normalized.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(normalized)) {
    return { ok: false, error: "Enter a valid email address" }
  }
  return { ok: true, email: normalized }
}
