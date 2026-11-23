"use client"

import { SendHorizontal } from "lucide-react"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"

import { cn } from "@/lib/utils"

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

const MIN_INPUT_HEIGHT = 72
const MAX_INPUT_HEIGHT = 160

interface ChatMessage {
  id: number
  role: "user" | "assistant"
  text: string
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 0,
  role: "assistant",
  text: "Hi! Describe the system you want to design and I can help sketch the architecture.",
}

// UI shell only: messages live in local state and nothing is sent anywhere yet.
export function AiArchitectTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [draft, setDraft] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Grow with the content between the min and max heights.
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT)}px`
  }, [draft])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages])

  function send() {
    const text = draft.trim()
    if (!text) return
    setMessages((current) => [...current, { id: current.length, role: "user", text }])
    setDraft("")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send()
    }
  }

  const hasUserMessage = messages.some((message) => message.role === "user")

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
              message.role === "user"
                ? "self-end border-2 border-brand/50 bg-accent-dim text-copy-primary"
                : "self-start border border-surface-border bg-elevated text-ai-text",
            )}
          >
            {message.text}
          </div>
        ))}

        {!hasUserMessage && (
          <div className="flex flex-wrap gap-2">
            {STARTER_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setDraft(chip)
                  textareaRef.current?.focus()
                }}
                className="cursor-pointer rounded-full bg-subtle px-3 py-1.5 text-xs text-ai-text transition-colors hover:bg-ai/20"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your architecture..."
          aria-label="Message"
          rows={1}
          style={{ minHeight: MIN_INPUT_HEIGHT, maxHeight: MAX_INPUT_HEIGHT }}
          className="w-full resize-none rounded-2xl border border-surface-border bg-surface py-3 pr-14 pl-4 text-sm text-copy-primary outline-none placeholder:text-copy-faint focus-visible:border-ai"
        />
        <button
          type="button"
          aria-label="Send message"
          onClick={send}
          disabled={!draft.trim()}
          className="absolute right-2.5 bottom-3.5 flex size-8 cursor-pointer items-center justify-center rounded-full bg-ai text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendHorizontal className="size-4" />
        </button>
      </div>
    </div>
  )
}
