// Browser-only signal that a spec has just been generated, so the spec list can
// refresh without waiting for a page load. Whatever starts spec generation calls
// `notifySpecGenerated()` when the run completes; the list listens.

const SPEC_GENERATED = "spec-generated"

export function notifySpecGenerated(): void {
  window.dispatchEvent(new Event(SPEC_GENERATED))
}

export function onSpecGenerated(handler: () => void): () => void {
  window.addEventListener(SPEC_GENERATED, handler)
  return () => window.removeEventListener(SPEC_GENERATED, handler)
}
