Add autosave and loading for the collaborative canvas so project state is persisted before adding AI generation. Canvas JSON should be stored in Vercel Blob, and the saved blob URL should be stored on the Prisma project record.

## What to Install

- `@vercel/blob`
- create a private Vercel Blob store and add its `BLOB_READ_WRITE_TOKEN` to `.env.local` (server only, never exposed to the client)

## Implementation

1. Check the existing project schema.
   - review `prisma/model/project.prisma`
   - reuse the existing `canvasJsonPath` field to hold the canvas blob URL (no migration needed); add a field only if reuse is not possible
   - keep Prisma responsible for metadata only

2. Add canvas save/load API routes.

   Create: `PUT /api/projects/[projectId]/canvas`

   This route should:
   - require a signed-in user with access to the project (owner or collaborator); respond `401` signed out, `403`/`404` without access, using the existing `{ error }` shape
   - receive the latest canvas JSON
   - validate the body: an object with `nodes` and `edges` arrays, and a maximum size (respond `400` for a bad shape and `413` when too large)
   - upload the JSON to Vercel Blob at a stable path per project, such as `canvas/<projectId>.json`, with overwrite allowed so each save replaces the previous blob instead of piling up new ones
   - store the returned blob URL on the matching Prisma project record

   Create: `GET /api/projects/[projectId]/canvas`

   This route should:
   - apply the same access checks as `PUT`
   - read the project’s saved blob URL from Prisma
   - fetch the saved canvas JSON from Vercel Blob
   - return the canvas state to the editor (an empty state when nothing has been saved yet)

   Blob access: use a private Blob store, so the canvas JSON cannot be read from its URL alone.
   - create the store as private (a store's access mode cannot be changed after it is created) and set `BLOB_READ_WRITE_TOKEN` for it
   - upload with `put(path, body, { access: "private", allowOverwrite: true })`
   - read only on the server, with `get(path, { access: "private" })` and `useCache: false` so a read right after a save returns the latest version; treat any status other than `200` as "nothing saved"
   - never send the blob URL or token to the client; the editor only ever receives canvas JSON from the `GET` route, after its access check
   - set `Cache-Control: private, no-cache` on the `GET` response

3. Add an autosave hook in the `/hook` folder.
   - watch the canvas nodes and edges
   - debounce saves to avoid excessive writes
   - save through the canvas API route
   - track save status: saving, saved, error
   - do not save until the load step (step 4) has finished, and never save an empty canvas over a saved one, so a fresh client cannot overwrite real data with nothing
   - skip a save when the serialized canvas is unchanged since the last save
   - any signed-in editor may save (all clients autosave; last write wins, since Liveblocks is the live source of truth)
   - flush immediately, without waiting for the debounce, when the tab is hidden or closed and when the Save button is clicked

4. Load saved canvas state in the editor.
   - when the editor loads, check if the Liveblocks room has any existing nodes or edges
   - if the room is empty and the project has a saved canvas blob URL, fetch and load the saved canvas state
   - if the room already has nodes or edges, skip the load entirely to avoid overwriting active collaboration
   - if two clients load an empty room at the same moment, both may import; keep node and edge IDs from the saved JSON so the result is identical rather than duplicated

5. Add a small save status indicator in the editor Save button.
   - create the Save button in the workspace navbar actions as part of this spec (none exists yet)
   - show saving, saved, or error states
   - clicking it saves immediately

6. Clean up when a project is deleted.
   - delete the project's canvas blob when the project is deleted (best effort: a blob failure must not block the delete)

## Storage Pattern

- Prisma stores project metadata and the canvas blob URL.
- Vercel Blob stores the actual canvas JSON.

## Scope Limits

- don’t change the existing Liveblocks setup or collaborative state
- don’t add version history or multiple snapshots per project
- don’t add AI generation logic
- don’t change node, edge, or shape rendering

## Check When Done

- Reloading a project restores its saved canvas when the room is empty.
- A room that already has nodes or edges is never overwritten by a load.
- An empty canvas never overwrites a saved one, and nothing saves before the load step finishes.
- The canvas blob is private: its URL does not return the canvas when opened directly, and the browser never receives the URL or token.
- Edits are saved after the debounce, and unchanged canvases are not re-saved.
- The Save button shows saving, saved, and error states, and clicking it saves immediately.
- Signed-out and no-access requests to the canvas routes are rejected with the `{ error }` shape; bad or oversized bodies return `400` or `413`.
- Deleting a project removes its canvas blob.
- `npm run build` passes without type errors.
