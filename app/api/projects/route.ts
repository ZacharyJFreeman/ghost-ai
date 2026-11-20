import { NextResponse } from "next/server"

import { Prisma } from "@/app/generated/prisma/client"
import {
  errorResponse,
  getAuthenticatedUserId,
  readJsonBody,
} from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { parseCreateBody } from "@/lib/project-validation"

export async function GET() {
  const userId = await getAuthenticatedUserId()
  if (!userId) return errorResponse("Unauthorized", 401)

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ projects })
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return errorResponse("Unauthorized", 401)

  const parsed = parseCreateBody(await readJsonBody(request))
  if (!parsed.ok) return errorResponse(parsed.error, 400)

  try {
    // Without a client-supplied id, Prisma generates the cuid.
    const project = await prisma.project.create({
      data: { ownerId: userId, name: parsed.name, ...(parsed.id && { id: parsed.id }) },
    })
    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("A project with this id already exists", 409)
    }
    throw error
  }
}
