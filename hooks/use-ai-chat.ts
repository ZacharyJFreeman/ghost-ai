"use client"

import { useCreateFeed, useCreateFeedMessage, useFeedMessages, useSelf } from "@liveblocks/react"
import { useCallback, useMemo } from "react"

import { sendChatMessage } from "@/lib/chat-feed"
import { AI_CHAT_FEED_ID, parseChatMessagePayload, type ChatMessagePayload } from "@/types/chat"
import { AI_USER_ID, AI_USER_NAME } from "@/types/tasks"

// The server returns at most 100 per page.
const PAGE_SIZE = 50

export interface ChatEntry extends ChatMessagePayload {
  id: string
  createdAt: number
}

// The room's chat: the `ai-chat` feed, oldest to newest, with only valid messages.
// Must be used inside the room provider.
export function useAiChat() {
  const selfId = useSelf((me) => me.id)
  const selfName = useSelf((me) => me.info?.name)
  const createFeed = useCreateFeed()
  const createFeedMessage = useCreateFeedMessage()

  // The newest page loads first and live messages are merged in; the list is
  // already sorted oldest to newest. `fetchMore` loads the next older page.
  const result = useFeedMessages(AI_CHAT_FEED_ID, { limit: PAGE_SIZE })
  const { messages, fetchMore } = result

  const entries = useMemo(() => {
    const valid: ChatEntry[] = []
    for (const message of messages ?? []) {
      const payload = parseChatMessagePayload(message.data)
      if (payload) valid.push({ id: message.id, createdAt: message.createdAt, ...payload })
    }
    return valid
  }, [messages])

  const canSend = selfId != null && selfName != null

  const writer = useMemo(
    () => ({ createFeed: (feedId: string) => createFeed(feedId), createFeedMessage }),
    [createFeed, createFeedMessage],
  )

  // Rejects when the message could not be sent (not connected, timeout, invalid).
  const send = useCallback(
    async (text: string) => {
      if (selfId == null || selfName == null) throw new Error("Not connected to the room yet")
      await sendChatMessage(writer, { text, senderId: selfId, senderName: selfName })
    },
    [selfId, selfName, writer],
  )

  // Posts a message as the AI. The design run's result is reported by the browser
  // that started it, so this is a claim like any sender: it is not checked by the server.
  const sendAsAi = useCallback(
    (text: string) => sendChatMessage(writer, { text, senderId: AI_USER_ID, senderName: AI_USER_NAME }),
    [writer],
  )

  return {
    entries,
    selfId: selfId ?? null,
    isLoading: result.isLoading ?? false,
    hasError: Boolean(result.error),
    hasEarlier: result.hasFetchedAll === false,
    isLoadingEarlier: result.isFetchingMore ?? false,
    loadEarlier: () => fetchMore?.(),
    canSend,
    send,
    sendAsAi,
  }
}
