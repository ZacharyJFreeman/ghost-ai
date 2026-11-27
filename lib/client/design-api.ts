import { request } from "@/lib/client/request"

// Client-side wrapper for the design API route. The server starts the task and
// returns a token that can read only that run.

export interface DesignRun {
  runId: string
  publicToken: string
}

interface DesignRunResponse extends Partial<DesignRun> {
  error?: string
}

// `projectId` is sent as well as `roomId` because the route checks they match
// (the room ID is the project ID).
export async function startDesignRun(prompt: string, roomId: string): Promise<DesignRun> {
  const data = await request<DesignRunResponse>("/api/ai/design", "POST", {
    prompt,
    roomId,
    projectId: roomId,
  })
  if (!data.runId || !data.publicToken) throw new Error("The design run could not be started.")
  return { runId: data.runId, publicToken: data.publicToken }
}
