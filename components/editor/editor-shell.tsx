"use client"

import { useState } from "react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"

export function EditorShell() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar isOpen={isOpen} onToggle={() => setIsOpen((open) => !open)} />
      <ProjectSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  )
}
