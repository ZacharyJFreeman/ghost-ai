// Shapes for AI task activity that is shared with everyone in a room.

// The AI joins a room as its own participant under this user ID. Real users are
// signed in with their Clerk ID, so no one else can hold it; anything that must
// trust "the AI is working" should check this ID, not just any participant.
export const AI_USER_ID = "ghost-ai"
export const AI_USER_NAME = "Ghost AI"

// The Liveblocks feed that carries AI status updates for a room. There is one
// feed per room, shared by every AI task (design now, spec generation later).
export const AI_STATUS_FEED_ID = "ai-status-feed"

// What a status message carries. Kept generic on purpose: the text is all a
// sidebar needs, and any AI task can write it.
export interface AiStatusPayload {
  text?: string
}

// Feed messages come from outside this code (the background task, and anything
// else with access to the room), so check one before showing it. Returns null
// when the message is not a valid status payload.
export function parseAiStatusPayload(value: unknown): AiStatusPayload | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null

  const { text } = value as { text?: unknown }
  if (text === undefined) return {}
  if (typeof text !== "string") return null

  const trimmed = text.trim()
  return trimmed ? { text: trimmed } : {}
}
