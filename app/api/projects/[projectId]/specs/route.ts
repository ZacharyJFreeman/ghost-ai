import { NextResponse } from "next/server"

import { authorizeProject } from "@/lib/api-project-access"
import { prisma } from "@/lib/prisma"
import { specFilename } from "@/lib/spec-filename"

interface RouteContext {
  params: Promise<{ projectId: string }>
}

const MAX_SPECS = 100

// Any owner or collaborator can list the specs of their project, newest first.
// Only metadata is returned: never the Blob URL, never the content (that comes
// from the download route).
export async function GET(_request: Request, { params }: RouteContext) {
  const { projectId } = await params

  // 401 signed out, 404 no such project, 403 no access to it.
  const authorized = await authorizeProject(projectId, false)
  if (!authorized.ok) return authorized.response

  const rows = await prisma.projectSpec.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: MAX_SPECS,
    select: { id: true, createdAt: true },
  })

  const specs = rows.map((row) => ({
    id: row.id,
    filename: specFilename(row.id),
    createdAt: row.createdAt.toISOString(),
  }))

  return NextResponse.json({ specs }, { headers: { "Cache-Control": "private, no-store" } })
}
