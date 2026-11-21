import { redirect } from "next/navigation"

import { EditorShell } from "@/components/editor/editor-shell"
import { getEditorProjects } from "@/lib/project-queries"
import { getCurrentIdentity } from "@/lib/project-access"

// Fetches owned and shared projects on the server and hands them to the shell.
export async function EditorLoader() {
  const identity = await getCurrentIdentity()
  if (!identity) redirect("/sign-in")

  const { owned, shared } = await getEditorProjects(identity.userId, identity.email)

  return <EditorShell ownedProjects={owned} sharedProjects={shared} />
}
