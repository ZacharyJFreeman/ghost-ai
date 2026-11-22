"use client"

import { PanelRight, Share2 } from "lucide-react"
import { useState } from "react"

import { Panel } from "@/components/app/panel"
import { PillButton } from "@/components/app/pill-button"
import { EditorCanvas } from "@/components/editor/editor-canvas"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useShareDialog } from "@/hooks/use-share-dialog"
import type { Project } from "@/lib/projects"
import { cn } from "@/lib/utils"

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
        <main className="relative min-w-0 flex-1 bg-base">
          <div className="absolute inset-0">
            <EditorCanvas roomId={project.id} />
          </div>
        </main>

        <div
          className={cn(
            "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-out md:block",
            isAiOpen ? "w-80" : "w-0"
          )}
        >
          <aside
            aria-label="AI chat"
            aria-hidden={!isAiOpen}
            inert={!isAiOpen}
            className={cn(
              "flex h-full w-80 flex-col justify-center border-l border-surface-border bg-surface p-4 transition-transform duration-200 ease-out",
              isAiOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            <Panel className="text-center">
              <p className="text-sm text-copy-muted">AI chat coming soon</p>
            </Panel>
          </aside>
        </div>
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
