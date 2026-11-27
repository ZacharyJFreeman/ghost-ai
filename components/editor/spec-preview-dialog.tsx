"use client"

import { Download, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import { AppDialog } from "@/components/app/app-dialog"
import { PillButton } from "@/components/app/pill-button"
import { SpecMarkdown } from "@/components/editor/spec-markdown"
import { errorMessage } from "@/lib/client/request"
import { fetchSpecMarkdown, type SpecSummary } from "@/lib/client/spec-api"
import { formatDateTime } from "@/lib/format-date"

interface SpecPreviewDialogProps {
  projectId: string
  // The spec to show; null keeps the dialog closed.
  spec: SpecSummary | null
  onClose: () => void
  onDownload: (spec: SpecSummary) => void
  isDownloading: boolean
  downloadError: string | null
}

interface LoadedSpec {
  specId: string
  markdown: string | null
  error: string | null
}

// Preview of one spec. The content comes through the download route (the same
// access checks as a download, never Blob directly) and is rendered as sanitized
// Markdown. Esc, a click on the backdrop, and the close button all close it, and
// focus stays inside while it is open (the dialog primitive handles both).
export function SpecPreviewDialog({
  projectId,
  spec,
  onClose,
  onDownload,
  isDownloading,
  downloadError,
}: SpecPreviewDialogProps) {
  const [loaded, setLoaded] = useState<LoadedSpec | null>(null)
  const specId = spec?.id

  useEffect(() => {
    if (!specId) return
    let cancelled = false
    fetchSpecMarkdown(projectId, specId)
      .then((markdown) => {
        if (!cancelled) setLoaded({ specId, markdown, error: null })
      })
      .catch((err) => {
        if (!cancelled) setLoaded({ specId, markdown: null, error: errorMessage(err) })
      })
    return () => {
      cancelled = true
    }
  }, [projectId, specId])

  // Loading until the result for this spec has arrived.
  const isLoading = spec !== null && loaded?.specId !== spec.id
  const result = spec !== null && loaded?.specId === spec.id ? loaded : null

  function handleOpenChange(open: boolean) {
    if (open) return
    setLoaded(null) // reopening the same spec fetches it again, error or not
    onClose()
  }

  return (
    <AppDialog
      open={spec !== null}
      onOpenChange={handleOpenChange}
      title={spec?.filename ?? ""}
      description={spec ? formatDateTime(spec.createdAt) : undefined}
      contentClassName="sm:max-w-3xl"
      footer={
        <>
          {downloadError && (
            <p role="alert" className="mr-auto self-center text-xs text-error">
              {downloadError}
            </p>
          )}
          <PillButton
            variant="dark"
            size="sm"
            aria-label="Download spec"
            disabled={!spec || isDownloading}
            onClick={() => spec && onDownload(spec)}
          >
            {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
            Download
          </PillButton>
        </>
      }
    >
      {isLoading && (
        <p role="status" className="flex items-center gap-2 text-sm text-copy-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading spec...
        </p>
      )}
      {result?.error && (
        <p role="alert" className="text-sm text-error">
          Couldn&apos;t load this spec. {result.error}
        </p>
      )}
      {result?.markdown != null && (
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <SpecMarkdown markdown={result.markdown} />
        </div>
      )}
    </AppDialog>
  )
}
