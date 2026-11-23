// A one-shot, local-only request to open a node's label editor. It is never
// stored in node data, so it is not synced to collaborators or saved.
// Used to open the text box of a line that was just given a label (by its edge
// id), and by the Enter shortcut to edit the selected node's label.

const EVENT_NAME = "ghost-ai:edit-node"

let pendingId: string | null = null

// Ask the node with this id to start editing. A node that is not mounted yet
// (just added) picks the request up when it mounts.
export function requestNodeEdit(id: string) {
  pendingId = id
  window.dispatchEvent(new CustomEvent<string>(EVENT_NAME, { detail: id }))
}

export function hasPendingEdit(id: string) {
  return pendingId === id
}

export function clearPendingEdit(id: string) {
  if (pendingId === id) pendingId = null
}

// Subscribe a mounted node to requests for its own id. Returns the unsubscribe.
export function onNodeEditRequest(id: string, handler: () => void) {
  function listener(event: Event) {
    if ((event as CustomEvent<string>).detail !== id) return
    clearPendingEdit(id)
    handler()
  }
  window.addEventListener(EVENT_NAME, listener)
  return () => window.removeEventListener(EVENT_NAME, listener)
}
