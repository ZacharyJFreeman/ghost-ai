"use client"

import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { useEffect, useRef } from "react"

import type { generateSpec } from "@/src/trigger/generate-spec"

// The task stops itself after 5 minutes. If the run has not ended well after that,
// the stream most likely dropped without saying so, so stop waiting.
const MAX_WAIT_MS = 7 * 60 * 1000

interface SpecRunTrackerProps {
  runId: string
  publicToken: string
  onFinished: (succeeded: boolean) => void
  onLost: () => void
}

// Follows one spec generation run in real time and reports when it ends. Render it
// only while that run is active and key it by run ID (the Trigger.dev hook keeps its
// state per instance, so a reused instance would show the previous run's last state).
export function SpecRunTracker({ runId, publicToken, onFinished, onLost }: SpecRunTrackerProps) {
  const { run, error } = useRealtimeRun<typeof generateSpec>(runId, { accessToken: publicToken })
  const reported = useRef(false)

  useEffect(() => {
    if (reported.current) return
    if (run?.isCompleted) {
      reported.current = true
      onFinished(run.isSuccess)
    } else if (error) {
      reported.current = true
      onLost()
    }
  }, [run, error, onFinished, onLost])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (reported.current) return
      reported.current = true
      onLost()
    }, MAX_WAIT_MS)
    return () => clearTimeout(timer)
  }, [onLost])

  return null
}
