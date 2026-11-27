import { tasks } from "@trigger.dev/sdk"
import { NextResponse } from "next/server"

import { authorizeProject } from "@/lib/api-project-access"
import { errorResponse, readJsonBody } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { specRequestSchema } from "@/lib/spec-generation"
import type { generateSpec } from "@/src/trigger/generate-spec"

export async function POST(request: Request) {
  const parsed = specRequestSchema.safeParse(await readJsonBody(request))
  if (!parsed.success) {
    return errorResponse("roomId, chatHistory, nodes and edges are required and must be valid", 400)
  }
  const { roomId, chatHistory, nodes, edges } = parsed.data

  // The room ID is the project ID. A client-supplied `projectId` is never read
  // (the schema drops it): access is resolved from the room ID alone.
  const projectId = roomId
  const result = await authorizeProject(projectId, false)
  if (!result.ok) return result.response

  const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
    projectId,
    roomId,
    chatHistory,
    nodes,
    edges,
  })

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId,
      userId: result.identity.userId,
    },
  })

  return NextResponse.json({ runId: handle.id })
}
