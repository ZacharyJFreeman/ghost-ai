// Shapes for the room chat in the AI sidebar.

// The Liveblocks feed that holds chat messages for a room. It is separate from
// the AI status feed (`AI_STATUS_FEED_ID` in `types/tasks.ts`): chat is what
// people said, status is what the AI is doing.
export const AI_CHAT_FEED_ID = "ai-chat"

export const MAX_CHAT_MESSAGE_LENGTH = 2000

// What a chat message carries. A feed message has no author, so the sender is
// part of the payload (the timestamp is the feed message's own `createdAt`).
export interface ChatMessagePayload {
  text: string
  senderId: string
  senderName: string
}

// Feed messages come from outside this code (any collaborator can write to the
// feed), so check one before showing it. Returns null when it is not a valid chat
// message. The sender fields are claims, not proof: anyone with access to the
// room can write a payload that names someone else.
export function parseChatMessagePayload(value: unknown): ChatMessagePayload | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null

  const { text, senderId, senderName } = value as Record<string, unknown>
  if (typeof text !== "string" || typeof senderId !== "string" || typeof senderName !== "string") return null

  const trimmedText = text.trim()
  const trimmedName = senderName.trim()
  if (!trimmedText || trimmedText.length > MAX_CHAT_MESSAGE_LENGTH) return null
  if (!senderId || !trimmedName) return null

  return { text: trimmedText, senderId, senderName: trimmedName }
}
