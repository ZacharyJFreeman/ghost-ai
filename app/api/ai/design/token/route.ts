import { NextResponse } from "next/server"

import {
  errorResponse,
  getAuthenticatedUserId,
  readJsonBody,
} from "@/lib/api-response"
import { createRunToken } from "@/lib/design-run-token"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
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

  const token = await createRunToken(runId)

  return NextResponse.json({ token })
}
