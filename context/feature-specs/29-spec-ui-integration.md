Integrate spec generation results into the editor so users can view, preview, and download specs from the existing ai sidebar specs tab.

### Implementation

1. Spec list

- in the right sidebar (Specs tab), show a list of specs for the current project
- fetch specs from the backend using the existing ProjectSpec API
- display:
  - createdAt
  - filename
- keep items simple and clickable
- list newest first, via `GET /api/projects/[projectId]/specs` (add it only if it does not already exist)
- `ProjectSpec` has no filename field: derive the filename from `filePath` (or add a `filename` column; decide before implementing)
- refresh the list after a spec finishes generating, not only on page load

2. Preview modal

- open a modal when a spec is selected
- fetch the spec content through an existing endpoint (do not access Blob directly from the client)
- reuse the download route to fetch the Markdown as text so access checks stay in one place
- render content as Markdown
- use the Markdown renderer already in the repo if there is one; sanitize any HTML
- include a close action and basic keyboard support
  - close on Esc and on backdrop click
  - trap focus inside the modal
  - add `aria-label`s to the close and download buttons

3. Download action

- add a download action for each spec (list item + modal)
- call the download endpoint
- let the browser handle the file download
- use the spec filename as the saved name
- disable the button while the request is in flight

### UI Details

- use existing sidebar layout, do not redesign
- loading state for the list and the modal
- empty state for the list ("No specs yet")
- error state for the list and the modal

### Scope Limits

- no backend or schema changes, unless a `filename` column is chosen
- no editing, deleting, or regenerating specs from this UI
- no new sidebar layout or redesign
- no direct Blob access from the client
