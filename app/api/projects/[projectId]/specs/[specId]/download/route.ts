import { authorizeProject } from "@/lib/api-project-access"
import { errorResponse } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { specFilename } from "@/lib/spec-filename"
import { readSpecBlob } from "@/lib/spec-storage"

interface RouteContext {
  params: Promise<{ projectId: string; specId: string }>
}

// Any owner or collaborator can download a spec of their project. The Blob URL
// stays on the server: the file is fetched here and sent as an attachment.
export async function GET(_request: Request, { params }: RouteContext) {
  const { projectId, specId } = await params

  // 401 signed out, 404 no such project, 403 no access to it.
  const authorized = await authorizeProject(projectId, false)
  if (!authorized.ok) return authorized.response

  // The spec must belong to this project: a spec ID from another project is "not found".
  const spec = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
    select: { filePath: true },
  })
  if (!spec) return errorResponse("Spec not found", 404)

  let markdown: string | null
  try {
    markdown = await readSpecBlob(spec.filePath)
  } catch (error) {
    console.error("Failed to read spec blob", error)
    return errorResponse("Could not load the spec", 502)
  }
  if (markdown === null) return errorResponse("Spec file not found", 404)

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${specFilename(specId)}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
