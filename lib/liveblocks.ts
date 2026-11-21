import { Liveblocks } from "@liveblocks/node"

const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined
}

// Server-only: cached Liveblocks node client. Created on first use so a missing
// key fails the request that needs it rather than every import.
export function getLiveblocks(): Liveblocks {
  if (!globalForLiveblocks.liveblocks) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) throw new Error("LIVEBLOCKS_SECRET_KEY is not set")
    globalForLiveblocks.liveblocks = new Liveblocks({ secret })
  }
  return globalForLiveblocks.liveblocks
}
