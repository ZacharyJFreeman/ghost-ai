import { NextResponse } from "next/server"

import { errorResponse, getAuthenticatedUserId, readJsonBody } from "@/lib/api-response"
import { createRunToken } from "@/lib/design-run-token"
import { prisma } from "@/lib/prisma"

// Shared body of the token routes (design and spec): the signed-in user may get a
// token only for a run they started, checked through the TaskRun record.
export async function runTokenResponse(request: Request, lifetime?: string) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return errorResponse("Unauthorized", 401)

  const body = await readJsonBody(request)
  const { runId } = (body ?? {}) as Record<string, unknown>
  if (typeof runId !== "string" || !runId) {
    return errorResponse("runId is required", 400)
  }

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
    select: { userId: true },
  })
  if (!taskRun) return errorResponse("Run not found", 404)
  if (taskRun.userId !== userId) return errorResponse("Forbidden", 403)

  return NextResponse.json({ token: await createRunToken(runId, lifetime) })
}
