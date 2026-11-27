"use client"

import { useRoom } from "@liveblocks/react"
import { Download, FileText, Loader2, Sparkles } from "lucide-react"
import { useCallback, useState, type RefObject } from "react"

import { PillButton } from "@/components/app/pill-button"
import { SpecPreviewDialog } from "@/components/editor/spec-preview-dialog"
import { SpecRunTracker } from "@/components/editor/spec-run-tracker"
import { useAiChat } from "@/hooks/use-ai-chat"
import { useProjectSpecs } from "@/hooks/use-project-specs"
import { useSpecDownload } from "@/hooks/use-spec-download"
import type { SavedCanvas } from "@/lib/client/canvas-api"
import { errorMessage } from "@/lib/client/request"
import { fetchSpecRunToken, startSpecRun, type SpecSummary } from "@/lib/client/spec-api"
import { formatDateTime } from "@/lib/format-date"
import { MAX_SPEC_CHAT_MESSAGES } from "@/lib/spec-generation"
import { notifySpecGenerated } from "@/lib/spec-events"

interface AiSpecsTabProps {
  // Returns the canvas as it is on screen (set by the canvas, read when generating).
  getCanvasRef: RefObject<(() => SavedCanvas) | null>
}

// The project's generated specs, newest first: click one to preview it, or use its
// download button. The room ID is the project ID. Generate Spec writes a new spec
// from the canvas and the room chat, follows the run, and refreshes the list when
// it finishes.
export function AiSpecsTab({ getCanvasRef }: AiSpecsTabProps) {
  const projectId = useRoom().id
  const chat = useAiChat()
  const { specs, error, isLoading, retry } = useProjectSpecs(projectId)
  const { download, downloadingId, error: downloadError } = useSpecDownload(projectId)
  const [previewSpec, setPreviewSpec] = useState<SpecSummary | null>(null)
  const [activeRun, setActiveRun] = useState<{ runId: string; publicToken: string } | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const isGenerating = isStarting || activeRun !== null

  async function generate() {
    const canvas = getCanvasRef.current?.() ?? { nodes: [], edges: [] }
    if (canvas.nodes.length === 0 && chat.entries.length === 0) {
      setGenerateError("Add something to the canvas or the chat first.")
      return
    }

    setIsStarting(true)
    setGenerateError(null)
    try {
      const chatHistory = chat.entries.slice(-MAX_SPEC_CHAT_MESSAGES).map((entry) => ({
        sender: entry.senderName,
        text: entry.text,
      }))
      const runId = await startSpecRun(projectId, chatHistory, canvas)
      setActiveRun({ runId, publicToken: await fetchSpecRunToken(runId) })
    } catch (err) {
      setGenerateError(errorMessage(err))
    } finally {
      setIsStarting(false)
    }
  }

  const handleFinished = useCallback((succeeded: boolean) => {
    setActiveRun(null)
    if (succeeded) notifySpecGenerated()
    else setGenerateError("Couldn't generate the spec. Please try again.")
  }, [])

  // The outcome is unknown; the list still refreshes when the window regains focus.
  const handleLost = useCallback(() => {
    setActiveRun(null)
    setGenerateError("Lost track of the spec run. It may still finish: it will appear in the list.")
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => void generate()}
        disabled={isGenerating}
        aria-busy={isGenerating}
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-ai text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {isGenerating ? "Generating..." : "Generate Spec"}
      </button>

      {activeRun && (
        <SpecRunTracker
          key={activeRun.runId}
          runId={activeRun.runId}
          publicToken={activeRun.publicToken}
          onFinished={handleFinished}
          onLost={handleLost}
        />
      )}

      {generateError && (
        <p role="alert" className="text-xs text-error">
          {generateError}
        </p>
      )}

      {isLoading && (
        <p role="status" className="flex items-center gap-2 text-xs text-copy-muted">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Loading specs...
        </p>
      )}

      {error && specs === null && (
        <div role="alert" className="grid justify-items-start gap-2">
          <p className="text-xs text-error">Couldn&apos;t load specs. {error}</p>
          <PillButton variant="dark" size="sm" onClick={retry}>
            Try again
          </PillButton>
        </div>
      )}

      {specs !== null && specs.length === 0 && <p className="text-xs text-copy-muted">No specs yet</p>}

      {specs !== null && specs.length > 0 && (
        <ul className="flex flex-col gap-2">
          {specs.map((spec) => (
            <li
              key={spec.id}
              className="flex items-center gap-1 rounded-2xl border border-surface-border bg-elevated p-1.5 pr-2"
            >
              <button
                type="button"
                onClick={() => setPreviewSpec(spec)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl p-1.5 text-left transition-colors outline-none hover:bg-subtle focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-subtle text-ai-text">
                  <FileText className="size-4" />
                </span>
                <span className="grid min-w-0 gap-0.5">
                  <span className="truncate text-sm font-medium text-copy-primary">{spec.filename}</span>
                  <span className="text-xs text-copy-muted">{formatDateTime(spec.createdAt)}</span>
                </span>
              </button>
              <PillButton
                variant="ghost"
                size="icon-sm"
                aria-label={`Download ${spec.filename}`}
                disabled={downloadingId === spec.id}
                onClick={() => void download(spec)}
              >
                {downloadingId === spec.id ? <Loader2 className="animate-spin" /> : <Download />}
              </PillButton>
            </li>
          ))}
        </ul>
      )}

      {downloadError && !previewSpec && (
        <p role="alert" className="text-xs text-error">
          {downloadError}
        </p>
      )}

      <SpecPreviewDialog
        projectId={projectId}
        spec={previewSpec}
        onClose={() => setPreviewSpec(null)}
        onDownload={(spec) => void download(spec)}
        isDownloading={previewSpec !== null && downloadingId === previewSpec.id}
        downloadError={previewSpec ? downloadError : null}
      />
    </div>
  )
}
