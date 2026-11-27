"use client"

import { Bot, X } from "lucide-react"
import type { RefObject } from "react"

import { PillButton } from "@/components/app/pill-button"
import { AiArchitectTab } from "@/components/editor/ai-architect-tab"
import { AiSpecsTab } from "@/components/editor/ai-specs-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SavedCanvas } from "@/lib/client/canvas-api"
import { cn } from "@/lib/utils"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
  // Lets the Specs tab read the canvas when generating a spec.
  getCanvasRef: RefObject<(() => SavedCanvas) | null>
}

// Active tab uses the AI accent (indigo). The shadcn accent token in this
// project is a neutral surface, so the AI tokens are used instead.
const TAB_CLASSES =
  "rounded-full text-copy-muted hover:text-copy-primary data-active:border-transparent data-active:bg-ai/15 data-active:text-ai-text dark:text-copy-muted dark:data-active:border-transparent dark:data-active:bg-ai/15 dark:data-active:text-ai-text"

// The right-hand AI chat sidebar. The parent owns open/close state; this keeps
// the width transition and slide-in that were on the placeholder.
export function AiSidebar({ isOpen, onClose, getCanvasRef }: AiSidebarProps) {
  return (
    <div
      className={cn(
        "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-out md:block",
        isOpen ? "w-80" : "w-0",
      )}
    >
      <aside
        aria-label="AI chat"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "flex h-full w-80 flex-col gap-4 border-l border-surface-border bg-base/95 p-4 shadow-2xl transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
            <Bot className="size-5" />
          </span>
          <div className="grid min-w-0 flex-1">
            <h2 className="truncate text-sm font-medium text-copy-primary">AI Workspace</h2>
            <p className="truncate text-xs text-copy-muted">Collaborate with Ghost AI</p>
          </div>
          <PillButton variant="ghost" size="icon" aria-label="Close AI sidebar" onClick={onClose}>
            <X className="size-4" />
          </PillButton>
        </header>

        <Tabs defaultValue="architect" className="min-h-0 flex-1 gap-4">
          <TabsList className="h-9 w-full rounded-full bg-subtle p-1">
            <TabsTrigger value="architect" className={TAB_CLASSES}>
              AI Architect
            </TabsTrigger>
            <TabsTrigger value="specs" className={TAB_CLASSES}>
              Specs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="architect" className="flex min-h-0 flex-col">
            <AiArchitectTab />
          </TabsContent>
          <TabsContent value="specs" className="overflow-y-auto">
            <AiSpecsTab getCanvasRef={getCanvasRef} />
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  )
}
