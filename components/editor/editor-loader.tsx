import { auth, currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

import { EditorShell } from "@/components/editor/editor-shell"
import { getEditorProjects } from "@/lib/project-queries"

interface EditorLoaderProps {
  activeProjectId?: string
}

// Fetches owned and shared projects on the server and hands them to the shell.
export async function EditorLoader({ activeProjectId }: EditorLoaderProps) {
  const { userId } = await auth.protect()
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? null

  const { owned, shared } = await getEditorProjects(userId, email)

  const activeProject = activeProjectId
    ? [...owned, ...shared].find((project) => project.id === activeProjectId)
    : undefined
  if (activeProjectId && !activeProject) notFound()

  return (
    <EditorShell
      ownedProjects={owned}
      sharedProjects={shared}
      activeProject={activeProject}
    />
  )
}
