"use client"

import { useCallback, useEffect, useState } from "react"

import { errorMessage } from "@/lib/client/request"
import { listSpecs, type SpecSummary } from "@/lib/client/spec-api"
import { onSpecGenerated } from "@/lib/spec-events"

// The specs of one project, newest first. Loads on mount and refreshes when a spec
// finishes generating (`notifySpecGenerated`) and when the window regains focus, so
// a spec made in another tab or by a collaborator shows up without a page load.
// A refresh keeps showing the current list instead of going back to loading.
export function useProjectSpecs(projectId: string) {
  const [specs, setSpecs] = useState<SpecSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Bumped by `retry` to run the effect (and so the first load) again.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      listSpecs(projectId)
        .then((next) => {
          if (cancelled) return
          setSpecs(next)
          setError(null)
        })
        .catch((err) => {
          if (!cancelled) setError(errorMessage(err))
        })
    }

    load()
    const stopListening = onSpecGenerated(load)
    window.addEventListener("focus", load)
    return () => {
      cancelled = true
      stopListening()
      window.removeEventListener("focus", load)
    }
  }, [projectId, attempt])

  const retry = useCallback(() => setAttempt((count) => count + 1), [])

  return { specs, error, isLoading: specs === null && error === null, retry }
}
