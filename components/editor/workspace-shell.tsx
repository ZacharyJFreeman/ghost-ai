"use client"

import { AlertCircle, Check, CopyPlus, Loader2, PanelRight, Save, Share2 } from "lucide-react"
import { useRef, useState } from "react"

import { PillButton } from "@/components/app/pill-button"
import { AiSidebar } from "@/components/editor/ai-sidebar"
import { EditorCanvas } from "@/components/editor/editor-canvas"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { EditorRoom } from "@/components/editor/editor-room"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { SaveAsDialog } from "@/components/editor/save-as-dialog"
import { ShareDialog } from "@/components/editor/share-dialog"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useSaveAs } from "@/hooks/use-save-as"
import { useShareDialog } from "@/hooks/use-share-dialog"
import type { SavedCanvas } from "@/lib/client/canvas-api"
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const saveNowRef = useRef<(() => void) | null>(null)
  const getCanvasRef = useRef<(() => SavedCanvas) | null>(null)
  const saveAs = useSaveAs(project.name, getCanvasRef)

  return (
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((open) => !open)}
        title={project.name}
        showUserMenu={false}
        actions={
          <>
            <PillButton
              variant="dark"
              size="sm"
              disabled={saveStatus === "saving"}
              onClick={() => saveNowRef.current?.()}
              className={saveStatus === "error" ? "text-error" : undefined}
            >
              {saveStatus === "saving" ? (
                <Loader2 className="animate-spin" />
              ) : saveStatus === "saved" ? (
                <Check />
              ) : saveStatus === "error" ? (
                <AlertCircle />
              ) : (
                <Save />
              )}
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                  ? "Saved"
                  : saveStatus === "error"
                    ? "Error"
                    : "Save"}
            </PillButton>
            <PillButton variant="dark" size="sm" onClick={saveAs.open}>
              <CopyPlus />
              Save as
            </PillButton>
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

      {/* One room connection for the canvas and the AI sidebar; keyed so switching
          projects remounts the room, load state, autosave, and chat. */}
      <EditorRoom key={project.id} roomId={project.id}>
        <div className="flex min-h-0 flex-1">
          <main className="relative min-w-0 flex-1 bg-base">
            <div className="absolute inset-0">
              <EditorCanvas
                onSaveStatusChange={setSaveStatus}
                saveNowRef={saveNowRef}
                getCanvasRef={getCanvasRef}
              />
            </div>
          </main>

          <AiSidebar isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} getCanvasRef={getCanvasRef} />
        </div>
      </EditorRoom>

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
      <SaveAsDialog saveAs={saveAs} />
      <ShareDialog share={share} isOwner={project.isOwner} />
    </div>
  )
}
