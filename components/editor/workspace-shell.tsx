"use client"

import { PanelRight, Share2 } from "lucide-react"
import { useState } from "react"

import { Panel } from "@/components/app/panel"
import { PillButton } from "@/components/app/pill-button"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useShareDialog } from "@/hooks/use-share-dialog"
import type { Project } from "@/lib/projects"

interface WorkspaceShellProps {
  project: Project
  ownedProjects: Project[]
  sharedProjects: Project[]
}

export function WorkspaceShell({ project, ownedProjects, sharedProjects }: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAiOpen, setIsAiOpen] = useState(true)
  const { openCreate, openRename, openDelete, ...dialogs } = useProjectActions()
  const share = useShareDialog(project.id)

  return (
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((open) => !open)}
        title={project.name}
        actions={
          <>
            <PillButton variant="dark" size="sm" onClick={() => void share.open()}>
              <Share2 />
              Share
            </PillButton>
            <PillButton
              variant="ghost"
              size="icon"
              aria-label={isAiOpen ? "Close AI sidebar" : "Open AI sidebar"}
              aria-pressed={isAiOpen}
              onClick={() => setIsAiOpen((open) => !open)}
            >
              <PanelRight className="size-5" />
            </PillButton>
          </>
        }
      />

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 items-center justify-center bg-base p-6">
          <div className="rounded-2xl border border-dashed border-surface-border px-8 py-10 text-center">
            <p className="text-sm text-copy-muted">Canvas coming soon</p>
          </div>
        </main>

        {isAiOpen && (
          <aside
            aria-label="AI chat"
            className="hidden w-80 shrink-0 flex-col justify-center border-l border-surface-border bg-surface p-4 md:flex"
          >
            <Panel className="text-center">
              <p className="text-sm text-copy-muted">AI chat coming soon</p>
            </Panel>
          </aside>
        )}
      </div>

      <ProjectSidebar
        isOpen={isSidebarOpen}
        activeProjectId={project.id}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onClose={() => setIsSidebarOpen(false)}
        onCreate={openCreate}
        onRename={openRename}
        onDelete={openDelete}
      />
      <ProjectDialogs {...dialogs} />
      <ShareDialog share={share} isOwner={project.isOwner} />
    </div>
  )
}
