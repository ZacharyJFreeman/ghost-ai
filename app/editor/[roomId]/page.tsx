import { redirect } from "next/navigation"
import { Suspense } from "react"

import { AccessDenied } from "@/components/editor/access-denied"
import { WorkspaceShell } from "@/components/editor/workspace-shell"
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"
import { getEditorProjects } from "@/lib/project-queries"

interface WorkspacePageProps {
  params: Promise<{ roomId: string }>
}

async function Workspace({ params }: WorkspacePageProps) {
  const { roomId } = await params

  const identity = await getCurrentIdentity()
  if (!identity) redirect("/sign-in")

  // Missing and unauthorized projects are treated the same.
  const project = await getProjectAccess(roomId, identity)
  if (!project) return <AccessDenied />

  const { owned, shared } = await getEditorProjects(identity.userId, identity.email)

  return (
    <WorkspaceShell project={project} ownedProjects={owned} sharedProjects={shared} />
  )
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  return (
    <Suspense fallback={null}>
      <Workspace params={params} />
    </Suspense>
  )
}
