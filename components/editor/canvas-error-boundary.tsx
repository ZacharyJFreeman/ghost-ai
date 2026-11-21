"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface CanvasErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

interface CanvasErrorBoundaryState {
  hasError: boolean
}

// Liveblocks suspense hooks throw on connection and auth failures, so the
// canvas is wrapped in a boundary that shows a fallback instead of crashing.
export class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Canvas failed to load", error, info.componentStack)
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}
