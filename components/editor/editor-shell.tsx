"use client"

import { useState } from "react"

import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { Project } from "@/lib/projects"

interface EditorShellProps {
  ownedProjects: Project[]
  sharedProjects: Project[]
  activeProject?: Project
}

export function EditorShell({ ownedProjects, sharedProjects, activeProject }: EditorShellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { openCreate, openRename, openDelete, ...dialogs } = useProjectActions()

  return (
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar isOpen={isOpen} onToggle={() => setIsOpen((open) => !open)} />
      {activeProject ? (
        <main className="flex flex-1 items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-medium text-copy-primary">{activeProject.name}</h1>
        </main>
      ) : (
        <EditorHome onNewProject={openCreate} />
      )}
      <ProjectSidebar
        isOpen={isOpen}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onClose={() => setIsOpen(false)}
        onCreate={openCreate}
        onRename={openRename}
        onDelete={openDelete}
      />
      <ProjectDialogs {...dialogs} />
    </div>
  )
}
