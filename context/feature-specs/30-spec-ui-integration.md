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

### Decisions Made

These settle the points the spec left open while implementing.

- Filename: no `filename` column was added. The name is derived from the spec ID as `spec-{id}.md` (`lib/spec-filename.ts`), the same name the download route sends, so the list, the saved file and the header always agree. The blob itself is stored as `{id}.md`.
- List route: `GET /api/projects/[projectId]/specs` did not exist, so it was added (owner or collaborator; 401, 404, 403 as the other project routes; newest first, at most 100). It returns `{ specs: [{ id, filename, createdAt }] }` and never the Blob URL or the content.
- Refresh after generation: nothing in the UI starts spec generation yet (the Generate Spec button still does nothing), so there is no run to listen to. The list loads on mount, reloads when the window regains focus, and reloads on a `spec-generated` browser event; whatever starts generation later calls `notifySpecGenerated()` (`lib/spec-events.ts`) when the run completes.
- Markdown renderer: none was installed, so `react-markdown` and `remark-gfm` (tables) were added. Raw HTML in a spec is dropped, unsafe link protocols are removed, and images are never loaded (the alt text is shown), so a spec cannot inject markup or make the browser fetch remote content.
- Modal: it reuses `AppDialog` (Base UI dialog: Esc, backdrop click, and focus trapping come with it). `AppDialog` gained an optional `contentClassName` (for a wider frame) and an explicit `aria-label="Close"` on its close button. The Download button has `aria-label="Download spec"`; list download buttons are labelled `Download {filename}`.
- Preview and download both fetch the download route. A download fetches the file, then saves it through a temporary link named after the spec, so the button can be disabled while the request is in flight and a failure shows an error instead of a JSON page.
- The Generate Spec button stays as it was (not part of this unit), and the demo card was replaced by the real list.
