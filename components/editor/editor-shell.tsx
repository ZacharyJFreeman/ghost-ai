"use client"

import { useState } from "react"

import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectDialogs } from "@/hooks/use-project-dialogs"

export function EditorShell() {
  const [isOpen, setIsOpen] = useState(false)
  const { projects, openCreate, openRename, openDelete, ...dialogs } = useProjectDialogs()

  return (
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar isOpen={isOpen} onToggle={() => setIsOpen((open) => !open)} />
      <EditorHome onNewProject={openCreate} />
      <ProjectSidebar
        isOpen={isOpen}
        projects={projects}
        onClose={() => setIsOpen(false)}
        onCreate={openCreate}
        onRename={openRename}
        onDelete={openDelete}
      />
      <ProjectDialogs {...dialogs} />
    </div>
  )
}
