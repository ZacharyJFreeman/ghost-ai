import { NextResponse } from "next/server"

import { errorResponse } from "@/lib/api-response"
import { authorizeProject } from "@/lib/api-project-access"
import { EMPTY_CANVAS, readCanvasBlob, saveCanvasBlob } from "@/lib/canvas-storage"
import { prisma } from "@/lib/prisma"

// Vercel rejects request bodies over 4.5 MB, so stay under that.
const MAX_CANVAS_BYTES = 4_000_000

interface RouteContext {
  params: Promise<{ projectId: string }>
}

function isCanvasBody(value: unknown): value is { nodes: unknown[]; edges: unknown[] } {
  if (!value || typeof value !== "object") return false
  const body = value as { nodes?: unknown; edges?: unknown }
  return Array.isArray(body.nodes) && Array.isArray(body.edges)
}

// Any owner or collaborator can read the saved canvas.
export async function GET(_request: Request, { params }: RouteContext) {
  const { projectId } = await params
  const authorized = await authorizeProject(projectId, false)
  if (!authorized.ok) return authorized.response

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  })

  let canvas = EMPTY_CANVAS
  if (project?.canvasJsonPath) {
    try {
      canvas = (await readCanvasBlob(project.canvasJsonPath)) ?? EMPTY_CANVAS
    } catch (error) {
      console.error("Failed to read canvas blob", error)
      return errorResponse("Could not load the canvas", 502)
    }
  }

  return NextResponse.json(canvas, { headers: { "Cache-Control": "private, no-cache" } })
}

// Any owner or collaborator can save: the body replaces the stored canvas.
export async function PUT(request: Request, { params }: RouteContext) {
  const { projectId } = await params
  const authorized = await authorizeProject(projectId, false)
  if (!authorized.ok) return authorized.response

  const declaredLength = Number(request.headers.get("content-length") ?? 0)
  if (declaredLength > MAX_CANVAS_BYTES) return errorResponse("Canvas is too large", 413)

  const text = await request.text()
  if (text.length > MAX_CANVAS_BYTES) return errorResponse("Canvas is too large", 413)

  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return errorResponse("Invalid request body", 400)
  }
  if (!isCanvasBody(body)) return errorResponse("Invalid request body", 400)

  try {
    const url = await saveCanvasBlob(
      projectId,
      JSON.stringify({ nodes: body.nodes, edges: body.edges })
    )
    await prisma.project.update({ where: { id: projectId }, data: { canvasJsonPath: url } })
  } catch (error) {
    console.error("Failed to save canvas", error)
    return errorResponse("Could not save the canvas", 502)
  }

  return NextResponse.json({ success: true })
}
