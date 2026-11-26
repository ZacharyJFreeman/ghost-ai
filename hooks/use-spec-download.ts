"use client"

import { useCallback, useState } from "react"

import { errorMessage } from "@/lib/client/request"
import { downloadSpec, type SpecSummary } from "@/lib/client/spec-api"

// Downloads a spec through the download route. `downloadingId` is the spec being
// fetched right now (its buttons are disabled meanwhile); a failure is kept in
// `error` until the next attempt.
export function useSpecDownload(projectId: string) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const download = useCallback(
    async (spec: SpecSummary) => {
      setDownloadingId(spec.id)
      setError(null)
      try {
        await downloadSpec(projectId, spec)
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setDownloadingId(null)
      }
    },
    [projectId],
  )

  return { download, downloadingId, error }
}
