"use client"

import { useRoom } from "@liveblocks/react"
import { Download, FileText, Loader2, Sparkles } from "lucide-react"
import { useState } from "react"

import { PillButton } from "@/components/app/pill-button"
import { SpecPreviewDialog } from "@/components/editor/spec-preview-dialog"
import { useProjectSpecs } from "@/hooks/use-project-specs"
import { useSpecDownload } from "@/hooks/use-spec-download"
import type { SpecSummary } from "@/lib/client/spec-api"
import { formatDateTime } from "@/lib/format-date"

// The project's generated specs, newest first: click one to preview it, or use its
// download button. The room ID is the project ID. The Generate Spec button does
// nothing yet: generating from the UI is not part of this unit.
export function AiSpecsTab() {
  const projectId = useRoom().id
  const { specs, error, isLoading, retry } = useProjectSpecs(projectId)
  const { download, downloadingId, error: downloadError } = useSpecDownload(projectId)
  const [previewSpec, setPreviewSpec] = useState<SpecSummary | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-ai text-sm font-medium text-white transition-opacity hover:opacity-85"
      >
        <Sparkles className="size-4" />
        Generate Spec
      </button>

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
