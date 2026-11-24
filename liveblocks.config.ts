// Liveblocks global types. Picked up automatically by @liveblocks/client and
// @liveblocks/react, so hooks like useSelf/useOthers are typed from this file.
declare global {
  interface Liveblocks {
    // Per-connection state shared with everyone in the room.
    Presence: {
      cursor: { x: number; y: number } | null
      isThinking: boolean
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
