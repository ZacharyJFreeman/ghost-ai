import { prisma } from "@/lib/prisma"
import type { Project } from "@/lib/projects"

interface EditorProjects {
  owned: Project[]
  shared: Project[]
}

// Server-only: reads owned and shared projects for the editor sidebar.
export async function getEditorProjects(
  userId: string,
  email: string | null
): Promise<EditorProjects> {
  const [owned, shared] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    email
      ? prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: { some: { email: { equals: email, mode: "insensitive" } } },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ])

  return {
    owned: owned.map((project) => ({ ...project, isOwner: true })),
    shared: shared.map((project) => ({ ...project, isOwner: false })),
  }
}
