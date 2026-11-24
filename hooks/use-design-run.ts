"use client"

import { useCallback, useState } from "react"

import type { DesignRun } from "@/lib/client/design-api"

export interface DesignRunOutcome {
  succeeded: boolean
  // What the AI says it did; only set when the run succeeded.
  summary?: string
}

// State for the design run this browser started: the run ID and token from the
// server, held from the moment the run starts until it reaches a final state.
// `DesignRunTracker` follows the run and calls `handleFinished` or `handleLost`.
// Other participants do not follow the run; they see the shared AI presence and
// status feed instead.
export function useDesignRun(onFinished: (outcome: DesignRunOutcome) => void) {
  const [activeRun, setActiveRun] = useState<DesignRun | null>(null)
  const [trackingFailed, setTrackingFailed] = useState(false)

  // The run reached a final state: reset, then report the outcome once.
  const handleFinished = useCallback(
    (outcome: DesignRunOutcome) => {
      setActiveRun(null)
      onFinished(outcome)
    },
    [onFinished],
  )

  // The connection or token failed, so the outcome is unknown. Stop waiting
  // without claiming the run failed; the shared AI presence still shows if it is working.
  const handleLost = useCallback(() => {
    setActiveRun(null)
    setTrackingFailed(true)
  }, [])

  const start = useCallback((run: DesignRun) => {
    setTrackingFailed(false)
    setActiveRun(run)
  }, [])

  const clearTrackingFailed = useCallback(() => setTrackingFailed(false), [])

  return {
    activeRun,
    isRunActive: activeRun !== null,
    trackingFailed,
    start,
    clearTrackingFailed,
    handleFinished,
    handleLost,
  }
}
