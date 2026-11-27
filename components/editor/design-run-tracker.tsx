"use client"

import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { useEffect, useRef } from "react"

import type { DesignRunOutcome } from "@/hooks/use-design-run"
import type { DesignRun } from "@/lib/client/design-api"
import type { designAgentTask } from "@/src/trigger/design-agent"

// The task stops itself after 10 minutes. If the run has not ended well after
// that, the stream most likely dropped without saying so, so stop waiting.
const MAX_WAIT_MS = 12 * 60 * 1000

interface DesignRunTrackerProps {
  run: DesignRun
  onFinished: (outcome: DesignRunOutcome) => void
  onLost: () => void
}

// Follows one design run in real time and reports when it ends. Render it only
// while that run is active and key it by run ID: the Trigger.dev hook keeps its
// state per instance, so a reused instance would show the previous run's last
// state for the next one.
export function DesignRunTracker({ run, onFinished, onLost }: DesignRunTrackerProps) {
  const { run: liveRun, error } = useRealtimeRun<typeof designAgentTask>(run.runId, {
    accessToken: run.publicToken,
  })
  const reported = useRef(false)

  useEffect(() => {
    if (reported.current) return
    if (liveRun?.isCompleted) {
      reported.current = true
      onFinished({ succeeded: liveRun.isSuccess, summary: liveRun.isSuccess ? liveRun.output?.summary : undefined })
    } else if (error) {
      reported.current = true
      onLost()
    }
  }, [liveRun, error, onFinished, onLost])

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
