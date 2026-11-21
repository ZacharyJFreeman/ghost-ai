"use client"

import { FolderOpen, Pencil, Plus, Trash2, Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Project } from "@/lib/projects"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  activeProjectId?: string
  ownedProjects: Project[]
  sharedProjects: Project[]
  onClose?: () => void
  onCreate: () => void
  onRename: (project: Project) => void
  onDelete: (project: Project) => void
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-surface-border px-4 py-10 text-center">
      <div className="text-copy-faint">{icon}</div>
      <p className="text-sm font-medium text-copy-secondary">{title}</p>
      <p className="text-xs text-copy-muted">{description}</p>
    </div>
  )
}

interface ProjectListProps {
  projects: Project[]
  activeProjectId?: string
  empty: React.ReactNode
  onRename: (project: Project) => void
  onDelete: (project: Project) => void
}

function ProjectList({ projects, activeProjectId, empty, onRename, onDelete }: ProjectListProps) {
  if (projects.length === 0) return empty

  return (
    <ul className="flex flex-col gap-1">
      {projects.map((project) => (
        <li
          key={project.id}
          aria-current={project.id === activeProjectId ? "page" : undefined}
          className={cn(
            "group flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-copy-secondary hover:bg-subtle",
            project.id === activeProjectId && "bg-subtle text-copy-primary"
          )}
        >
          <span className="truncate">{project.name}</span>
          {project.isOwner && (
            <span className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Rename ${project.name}`}
                onClick={() => onRename(project)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Delete ${project.name}`}
                onClick={() => onDelete(project)}
              >
                <Trash2 />
              </Button>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

export function ProjectSidebar({
  isOpen,
  activeProjectId,
  ownedProjects,
  sharedProjects,
  onClose,
  onCreate,
  onRename,
  onDelete,
}: ProjectSidebarProps) {
  return (
    <>
    <div
      aria-hidden="true"
      onClick={onClose}
      className={cn(
        "fixed inset-0 z-30 bg-background/70 transition-opacity duration-200 md:hidden",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    />
    <aside
      aria-label="Projects"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-surface-border bg-surface shadow-2xl transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <header className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h2 className="text-sm font-medium text-copy-primary">Projects</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close projects sidebar"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <Tabs defaultValue="my-projects" className="flex-1 gap-3 overflow-y-auto p-4">
        <TabsList className="w-full">
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>
        <TabsContent value="my-projects">
          <ProjectList
            projects={ownedProjects}
            activeProjectId={activeProjectId}
            onRename={onRename}
            onDelete={onDelete}
            empty={
              <EmptyState
                icon={<FolderOpen className="h-5 w-5" />}
                title="No projects yet"
                description="Projects you create will appear here."
              />
            }
          />
        </TabsContent>
        <TabsContent value="shared">
          <ProjectList
            projects={sharedProjects}
            activeProjectId={activeProjectId}
            onRename={onRename}
            onDelete={onDelete}
            empty={
              <EmptyState
                icon={<Users className="h-5 w-5" />}
                title="Nothing shared yet"
                description="Projects shared with you will appear here."
              />
            }
          />
        </TabsContent>
      </Tabs>

      <div className="border-t border-surface-border p-4">
        <Button className="w-full" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
    </>
  )
}
