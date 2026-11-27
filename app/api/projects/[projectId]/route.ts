import { NextResponse } from "next/server"

import {
  errorResponse,
  getAuthenticatedUserId,
  readJsonBody,
} from "@/lib/api-response"
import { deleteCanvasBlob } from "@/lib/canvas-storage"
import { prisma } from "@/lib/prisma"
import { parseRenameName } from "@/lib/project-validation"
import { deleteSpecBlobs } from "@/lib/spec-storage"

interface RouteContext {
  params: Promise<{ projectId: string }>
}

type OwnedProject =
  | { ok: true }
  | { ok: false; response: ReturnType<typeof errorResponse> }

async function requireOwnedProject(
  projectId: string,
  userId: string
): Promise<OwnedProject> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })

  if (!project) return { ok: false, response: errorResponse("Project not found", 404) }
  if (project.ownerId !== userId) {
    return { ok: false, response: errorResponse("Forbidden", 403) }
  }
  return { ok: true }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return errorResponse("Unauthorized", 401)

  const parsed = parseRenameName(await readJsonBody(request))
  if (!parsed.ok) return errorResponse(parsed.error, 400)

  const { projectId } = await params
  const access = await requireOwnedProject(projectId, userId)
  if (!access.ok) return access.response

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name: parsed.name },
  })

  return NextResponse.json({ project })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return errorResponse("Unauthorized", 401)

  const { projectId } = await params
  const access = await requireOwnedProject(projectId, userId)
  if (!access.ok) return access.response

  const { canvasJsonPath } = (await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  })) ?? { canvasJsonPath: null }

  // The spec rows go with the project (cascade); their blobs are removed here.
  const specs = await prisma.projectSpec.findMany({ where: { projectId }, select: { filePath: true } })

  await prisma.project.delete({ where: { id: projectId } })
  if (canvasJsonPath) await deleteCanvasBlob(canvasJsonPath)
  await deleteSpecBlobs(specs.map((spec) => spec.filePath))

  return NextResponse.json({ success: true })
}
