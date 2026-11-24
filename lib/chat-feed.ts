import { AI_CHAT_FEED_ID, MAX_CHAT_MESSAGE_LENGTH, type ChatMessagePayload } from "../types/chat"

// The two feed writes a client can make. In the app these come from the Liveblocks
// hooks (`useCreateFeed`, `useCreateFeedMessage`); the room object has the same ones.
export interface ChatFeedWriter {
  createFeed: (feedId: string) => Promise<void>
  createFeedMessage: (feedId: string, data: { text: string; senderId: string; senderName: string }) => Promise<void>
}

// Liveblocks rejects a feed write with an error whose `context.code` says why.
function errorCode(error: unknown): string | undefined {
  return (error as { context?: { code?: string } } | null)?.context?.code
}

// Sends one chat message. Writing to a feed that does not exist yet fails with
// FEED_NOT_FOUND, so the first message in a room creates the feed and tries again.
// If someone else creates it at the same moment (FEED_ALREADY_EXISTS), that is fine.
// Any other failure is thrown for the caller to show.
export async function sendChatMessage(writer: ChatFeedWriter, message: ChatMessagePayload): Promise<void> {
  const text = message.text.trim()
  if (!text || text.length > MAX_CHAT_MESSAGE_LENGTH) throw new Error("Invalid chat message")
  const data = { text, senderId: message.senderId, senderName: message.senderName }

  try {
    await writer.createFeedMessage(AI_CHAT_FEED_ID, data)
    return
  } catch (error) {
    if (errorCode(error) !== "FEED_NOT_FOUND") throw error
  }

  try {
    await writer.createFeed(AI_CHAT_FEED_ID)
  } catch (error) {
    if (errorCode(error) !== "FEED_ALREADY_EXISTS") throw error
  }
  await writer.createFeedMessage(AI_CHAT_FEED_ID, data)
}
