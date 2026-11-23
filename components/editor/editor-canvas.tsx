"use client"

import { ClientSideSuspense, LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense"
import type { ReactNode, RefObject } from "react"

import { Panel } from "@/components/app/panel"
import { PillButton } from "@/components/app/pill-button"
import { CanvasErrorBoundary } from "@/components/editor/canvas-error-boundary"
import { CanvasFlow } from "@/components/editor/canvas-flow"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"
import { PresenceAvatars } from "@/components/editor/presence-avatars"
import type { SavedCanvas } from "@/lib/client/canvas-api"

interface EditorCanvasProps {
  roomId: string
  onSaveStatusChange?: (status: SaveStatus) => void
  saveNowRef?: RefObject<(() => void) | null>
  getCanvasRef?: RefObject<(() => SavedCanvas) | null>
}

function CanvasMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Panel className="flex flex-col items-center gap-3 text-center">{children}</Panel>
    </div>
  )
}

function CanvasLoading() {
  return (
    <CanvasMessage>
      <p className="text-sm text-copy-muted">Loading canvas...</p>
    </CanvasMessage>
  )
}

function CanvasError() {
  return (
    <CanvasMessage>
      <p className="text-sm text-copy-muted">
        Couldn&apos;t connect to the canvas. Check your connection and try again.
      </p>
      <PillButton variant="dark" size="sm" onClick={() => window.location.reload()}>
        Reload
      </PillButton>
    </CanvasMessage>
  )
}

// Sets up the Liveblocks room for a project (the room ID is the project ID) and
// renders the collaborative canvas inside it.
export function EditorCanvas({
  roomId,
  onSaveStatusChange,
  saveNowRef,
  getCanvasRef,
}: EditorCanvasProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, isThinking: false }}>
        <PresenceAvatars />
        <CanvasErrorBoundary fallback={<CanvasError />}>
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <CanvasFlow
              onSaveStatusChange={onSaveStatusChange}
              saveNowRef={saveNowRef}
              getCanvasRef={getCanvasRef}
            />
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
