"use client"

import { useFeedMessages, useOthers } from "@liveblocks/react"

import { AI_STATUS_FEED_ID, AI_USER_ID, parseAiStatusPayload } from "@/types/tasks"

interface AiStatus {
  // True while the AI participant is thinking. Only the AI counts: any collaborator
  // can set their own presence, and one of them must not lock everyone's input.
  isThinking: boolean
  // Text of the most recent feed message, or null when there is none or it is not valid.
  statusText: string | null
}

// Shared AI activity for the current room: the working state comes from presence
// and the status text from the `ai-status-feed` feed, so every participant sees
// the same thing. Must be used inside the room provider.
export function useAiStatus(): AiStatus {
  const isThinking = useOthers((others) =>
    others.some((other) => other.id === AI_USER_ID && other.presence.isThinking),
  )

  // Pages come back newest first and live messages are merged in, so a page of one
  // is enough. The list is sorted oldest to newest, so the latest is the last one.
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID, { limit: 1 })
  const latest = messages?.at(-1)
  const statusText = latest ? (parseAiStatusPayload(latest.data)?.text ?? null) : null

  return { isThinking, statusText }
}
