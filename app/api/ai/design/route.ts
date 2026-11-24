import { tasks } from "@trigger.dev/sdk"
import { NextResponse } from "next/server"

import { authorizeProject } from "@/lib/api-project-access"
import { errorResponse, readJsonBody } from "@/lib/api-response"
import { createRunToken } from "@/lib/design-run-token"
import { prisma } from "@/lib/prisma"
import type { designAgentTask } from "@/src/trigger/design-agent"

export async function POST(request: Request) {
  const body = await readJsonBody(request)
  const { prompt, roomId, projectId } = (body ?? {}) as Record<string, unknown>

  if (
    typeof prompt !== "string" ||
    !prompt.trim() ||
    typeof roomId !== "string" ||
    typeof projectId !== "string" ||
    !roomId ||
    !projectId
  ) {
    return errorResponse("prompt, roomId and projectId are required", 400)
  }

  // The room ID is the project ID.
  if (roomId !== projectId) {
    return errorResponse("roomId does not match projectId", 400)
  }

  const result = await authorizeProject(projectId, false)
  if (!result.ok) return result.response

  const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
    prompt: prompt.trim(),
    roomId,
  })

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId,
      userId: result.identity.userId,
    },
  })

  // The browser follows the run with this token (it can read only this run).
  const publicToken = await createRunToken(handle.id)

  return NextResponse.json({ runId: handle.id, publicToken })
}
