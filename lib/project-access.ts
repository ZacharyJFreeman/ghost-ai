import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"

export interface CurrentIdentity {
  userId: string
  email: string | null
}

export interface ProjectAccess {
  id: string
  name: string
  isOwner: boolean
}

// Server-only: the signed-in Clerk user's ID and primary email, or null.
export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  return { userId, email: user?.primaryEmailAddress?.emailAddress ?? null }
}

// Server-only: returns the project if the identity owns it or is a collaborator.
// A missing project and an unauthorized one are indistinguishable (both null).
export async function getProjectAccess(
  projectId: string,
  identity: CurrentIdentity
): Promise<ProjectAccess | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: identity.userId },
        ...(identity.email
          ? [
              {
                collaborators: {
                  some: { email: { equals: identity.email, mode: "insensitive" as const } },
                },
              },
            ]
          : []),
      ],
    },
    select: { id: true, name: true, ownerId: true },
  })

  if (!project) return null
  return { id: project.id, name: project.name, isOwner: project.ownerId === identity.userId }
}
