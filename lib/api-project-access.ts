import { errorResponse } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import {
  getCurrentIdentity,
  getProjectAccess,
  type CurrentIdentity,
  type ProjectAccess,
} from "@/lib/project-access"

type AuthorizeResult =
  | { ok: true; identity: CurrentIdentity; access: ProjectAccess }
  | { ok: false; response: ReturnType<typeof errorResponse> }

// Shared API guard: 401 if signed out, 404 if the project doesn't exist,
// 403 if the user has no access (or, with ownerOnly, isn't the owner).
export async function authorizeProject(
  projectId: string,
  ownerOnly: boolean
): Promise<AuthorizeResult> {
  const identity = await getCurrentIdentity()
  if (!identity) return { ok: false, response: errorResponse("Unauthorized", 401) }

  const access = await getProjectAccess(projectId, identity)
  if (!access) {
    const exists = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })
    return {
      ok: false,
      response: exists ? errorResponse("Forbidden", 403) : errorResponse("Project not found", 404),
    }
  }

  if (ownerOnly && !access.isOwner) {
    return { ok: false, response: errorResponse("Forbidden", 403) }
  }

  return { ok: true, identity, access }
}
