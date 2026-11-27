"use client"

import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense"
import type { ReactNode } from "react"

interface EditorRoomProps {
  roomId: string
  children: ReactNode
}

// Connects to the project's Liveblocks room (the room ID is the project ID) and
// shares that one connection with everything inside it: the canvas, presence,
// and the AI sidebar.
export function EditorRoom({ roomId, children }: EditorRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, isThinking: false }}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  )
}
