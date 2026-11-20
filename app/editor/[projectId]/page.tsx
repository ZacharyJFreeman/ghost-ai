import { Suspense } from "react"

import { EditorLoader } from "@/components/editor/editor-loader"

interface WorkspacePageProps {
  params: Promise<{ projectId: string }>
}

async function Workspace({ params }: WorkspacePageProps) {
  const { projectId } = await params
  return <EditorLoader activeProjectId={projectId} />
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  return (
    <Suspense fallback={null}>
      <Workspace params={params} />
    </Suspense>
  )
}
