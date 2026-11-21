"use client"

import { PanelRight, Share2 } from "lucide-react"
import { useState } from "react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
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

  return (
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((open) => !open)}
        title={project.name}
        actions={
          <>
            {/* Sharing behavior is out of scope for this spec. */}
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={isAiOpen ? "Close AI sidebar" : "Open AI sidebar"}
              aria-pressed={isAiOpen}
              onClick={() => setIsAiOpen((open) => !open)}
            >
              <PanelRight className="h-5 w-5" />
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 items-center justify-center bg-base px-4 text-center">
          <p className="text-sm text-copy-muted">Canvas coming soon</p>
        </main>

        {isAiOpen && (
          <aside
            aria-label="AI chat"
            className="hidden w-80 shrink-0 flex-col items-center justify-center border-l border-surface-border bg-surface px-4 text-center md:flex"
          >
            <p className="text-sm text-copy-muted">AI chat coming soon</p>
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
    </div>
  )
}
