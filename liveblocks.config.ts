// Liveblocks global types. Picked up automatically by @liveblocks/client and
// @liveblocks/react, so hooks like useSelf/useOthers are typed from this file.
declare global {
  interface Liveblocks {
    // Per-connection state shared with everyone in the room.
    Presence: {
      cursor: { x: number; y: number } | null
      isThinking: boolean
    }

    // Room events: the shared AI status feed, broadcast by the design agent task
    // (src/trigger/design-agent.ts) and delivered to everyone in the room.
    RoomEvent: {
      type: "ai-status"
      runId: string
      status: "start" | "processing" | "complete" | "error"
      message: string
    }

    // Static user data attached by the auth route (`POST /api/liveblocks-auth`).
    UserMeta: {
      id: string
      info: {
        name: string
        avatar: string
        color: string
      }
    }
  }
}

export {}
