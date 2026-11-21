import { NextResponse } from "next/server"

import { authorizeProject } from "@/lib/api-project-access"
import { errorResponse } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

interface RouteContext {
  params: Promise<{ projectId: string; collaboratorId: string }>
}

// Only the owner can remove a collaborator.
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { projectId, collaboratorId } = await params
  const guard = await authorizeProject(projectId, true)
  if (!guard.ok) return guard.response

  const { count } = await prisma.projectCollaborator.deleteMany({
    where: { id: collaboratorId, projectId },
  })
  if (count === 0) return errorResponse("Collaborator not found", 404)

  return NextResponse.json({ success: true })
}
