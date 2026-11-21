import { NextResponse } from "next/server"

import { Prisma } from "@/app/generated/prisma/client"
import { authorizeProject } from "@/lib/api-project-access"
import { errorResponse, readJsonBody } from "@/lib/api-response"
import { getShareData } from "@/lib/collaborators"
import { prisma } from "@/lib/prisma"
import { parseInviteEmail } from "@/lib/project-validation"

interface RouteContext {
  params: Promise<{ projectId: string }>
}

// Owners and collaborators can view the list.
export async function GET(_request: Request, { params }: RouteContext) {
  const { projectId } = await params
  const guard = await authorizeProject(projectId, false)
  if (!guard.ok) return guard.response

  return NextResponse.json(await getShareData(projectId, guard.access.ownerId))
}

// Only the owner can invite.
export async function POST(request: Request, { params }: RouteContext) {
  const { projectId } = await params
  const guard = await authorizeProject(projectId, true)
  if (!guard.ok) return guard.response

  const parsed = parseInviteEmail(await readJsonBody(request))
  if (!parsed.ok) return errorResponse(parsed.error, 400)

  if (parsed.email === guard.identity.email?.toLowerCase()) {
    return errorResponse("You already own this project", 400)
  }

  try {
    await prisma.projectCollaborator.create({
      data: { projectId, email: parsed.email },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("This person is already a collaborator", 409)
    }
    throw error
  }

  return NextResponse.json(await getShareData(projectId, guard.access.ownerId), { status: 201 })
}
