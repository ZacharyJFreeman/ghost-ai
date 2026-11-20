import { NextResponse } from "next/server"

import {
  errorResponse,
  getAuthenticatedUserId,
  readJsonBody,
} from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { parseCreateName } from "@/lib/project-validation"

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

  const parsed = parseCreateName(await readJsonBody(request))
  if (!parsed.ok) return errorResponse(parsed.error, 400)

  const project = await prisma.project.create({
    data: { ownerId: userId, name: parsed.name },
  })

  return NextResponse.json({ project }, { status: 201 })
}
