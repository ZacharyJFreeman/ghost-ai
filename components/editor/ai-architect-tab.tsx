"use client"

import { useRoom } from "@liveblocks/react"
import { Loader2, SendHorizontal } from "lucide-react"
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react"

import { DesignRunTracker } from "@/components/editor/design-run-tracker"
import { useAiChat, type ChatEntry } from "@/hooks/use-ai-chat"
import { useAiStatus } from "@/hooks/use-ai-status"
import { useDesignRun, type DesignRunOutcome } from "@/hooks/use-design-run"
import { startDesignRun } from "@/lib/client/design-api"
import { cn } from "@/lib/utils"
import { MAX_CHAT_MESSAGE_LENGTH } from "@/types/chat"
import { AI_USER_ID } from "@/types/tasks"

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

const MIN_INPUT_HEIGHT = 72
const MAX_INPUT_HEIGHT = 160

// A local greeting, not part of the room's chat: it is not stored or shared.
const WELCOME_TEXT = "Hi! Describe the system you want to design and I can help sketch the architecture."

const BUBBLE = "rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap"

// Time for today's messages, date and time for older ones.
function formatSentAt(createdAt: number) {
  const date = new Date(createdAt)
  if (date.toDateString() === new Date().toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  }
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

function ChatBubble({ entry, isOwn }: { entry: ChatEntry; isOwn: boolean }) {
  const isAi = entry.senderId === AI_USER_ID
  return (
    <div className={cn("flex max-w-[85%] flex-col gap-1", isOwn ? "items-end self-end" : "items-start self-start")}>
      <span className="px-1 text-xs text-copy-muted">
        {isOwn ? "You" : entry.senderName} · {formatSentAt(entry.createdAt)}
      </span>
      <div
        className={cn(
          BUBBLE,
          isOwn
            ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
            : cn("border border-surface-border bg-elevated", isAi ? "text-ai-text" : "text-copy-primary"),
        )}
      >
        {entry.text}
      </div>
    </div>
  )
}

// What the AI says in the chat when a run ends. A failed run says nothing about
// the canvas: changes are applied one at a time, so some may already be there.
const FAILED_RUN_TEXT = "I couldn't finish this design. Please try again."

// Room chat (the `ai-chat` feed) plus the shared AI state: everyone in the room
// sees the same messages, working state, and status line. Submitting a message
// also starts a design run, which this browser follows until it finishes.
export function AiArchitectTab() {
  const roomId = useRoom().id
  const { isThinking, statusText } = useAiStatus()
  const chat = useAiChat()
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  // "send": the chat message did not go out. "start": it did, but the design run did not start.
  const [submitError, setSubmitError] = useState<"send" | "start" | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Grow with the content between the min and max heights.
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT)}px`
  }, [draft])

  // Follow new messages, but not when older ones load above.
  const lastEntryId = chat.entries.at(-1)?.id
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [lastEntryId])

  // When the run ends, the AI posts its result to the chat (best effort: the
  // run is over either way).
  const { sendAsAi } = chat
  const handleRunFinished = useCallback(
    (outcome: DesignRunOutcome) => {
      const text = outcome.succeeded ? outcome.summary?.trim() || "Design updated." : FAILED_RUN_TEXT
      void sendAsAi(text.slice(0, MAX_CHAT_MESSAGE_LENGTH)).catch(() => {})
    },
    [sendAsAi],
  )
  const designRun = useDesignRun(handleRunFinished)

  // The AI is working when its presence says so (everyone sees that) or when the
  // run this browser started is still going (which covers the wait in the queue).
  const isAiWorking = isThinking || designRun.isRunActive

  async function send() {
    const text = draft.trim()
    if (!text || isAiWorking || isSending || !chat.canSend) return
    setIsSending(true)
    setSubmitError(null)
    designRun.clearTrackingFailed()

    // 1. Put the message in the chat for everyone.
    try {
      await chat.send(text)
    } catch {
      // Keep the draft so nothing is lost; the user can try again.
      setSubmitError("send")
      setIsSending(false)
      return
    }
    setDraft("")

    // 2. Start the design run and follow it.
    try {
      designRun.start(await startDesignRun(text, roomId))
    } catch {
      setSubmitError("start")
      setDraft((current) => current || text)
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void send()
    }
  }

  const isBusy = isAiWorking || isSending
  const isEmpty = !chat.isLoading && !chat.hasError && chat.entries.length === 0

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {chat.hasEarlier && (
          <button
            type="button"
            disabled={chat.isLoadingEarlier}
            onClick={chat.loadEarlier}
            className="cursor-pointer self-center rounded-full bg-subtle px-3 py-1.5 text-xs text-copy-muted transition-colors hover:text-copy-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {chat.isLoadingEarlier ? "Loading..." : "Load earlier messages"}
          </button>
        )}

        {!chat.hasEarlier && (
          <div className={cn(BUBBLE, "max-w-[85%] self-start border border-surface-border bg-elevated text-ai-text")}>
            {WELCOME_TEXT}
          </div>
        )}

        {chat.hasError && <p className="text-xs text-error">Couldn&apos;t load chat messages.</p>}

        {chat.entries.map((entry) => (
          <ChatBubble key={entry.id} entry={entry} isOwn={entry.senderId === chat.selfId} />
        ))}

        {isEmpty && (
          <div className="flex flex-wrap gap-2">
            {STARTER_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={isAiWorking}
                onClick={() => {
                  setDraft(chip)
                  textareaRef.current?.focus()
                }}
                className="cursor-pointer rounded-full bg-subtle px-3 py-1.5 text-xs text-ai-text transition-colors hover:bg-ai/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {designRun.activeRun && (
        <DesignRunTracker
          key={designRun.activeRun.runId}
          run={designRun.activeRun}
          onFinished={designRun.handleFinished}
          onLost={designRun.handleLost}
        />
      )}

      {(isAiWorking || statusText) && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl bg-ai/10 px-3 py-2 text-xs text-ai-text"
        >
          {isAiWorking && <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />}
          <span className="line-clamp-2 min-w-0 flex-1 break-words">
            {statusText ?? "Ghost AI is working..."}
          </span>
        </div>
      )}

      {submitError === "send" && (
        <p role="alert" className="text-xs text-error">
          Couldn&apos;t send your message. Check your connection and try again.
        </p>
      )}
      {submitError === "start" && (
        <p role="alert" className="text-xs text-error">
          Your message was sent, but the AI couldn&apos;t start. Try sending it again.
        </p>
      )}
      {designRun.trackingFailed && (
        <p role="alert" className="text-xs text-error">
          Lost track of the AI run. The design may still finish.
        </p>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            if (submitError) setSubmitError(null)
          }}
          onKeyDown={handleKeyDown}
          placeholder={isAiWorking ? "Ghost AI is working..." : "Describe your architecture..."}
          aria-label="Message"
          rows={1}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          disabled={isAiWorking}
          readOnly={isSending}
          style={{ minHeight: MIN_INPUT_HEIGHT, maxHeight: MAX_INPUT_HEIGHT }}
          className="w-full resize-none rounded-2xl border border-surface-border bg-surface py-3 pr-14 pl-4 text-sm text-copy-primary outline-none placeholder:text-copy-faint focus-visible:border-ai disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          aria-label={isAiWorking ? "Ghost AI is working" : isSending ? "Sending message" : "Send message"}
          aria-busy={isBusy}
          onClick={() => void send()}
          disabled={isBusy || !draft.trim() || !chat.canSend}
          className="absolute right-2.5 bottom-3.5 flex size-8 cursor-pointer items-center justify-center rounded-full bg-ai text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isBusy ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
        </button>
      </div>
    </div>
  )
}
