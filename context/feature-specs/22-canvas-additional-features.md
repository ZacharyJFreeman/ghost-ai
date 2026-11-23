Add the ability to drag on the canvas and select multiple shapes. While selected they should be able to be deleted, breaking all links and only deleting the selected shapes. Also add clicking on an existing line between shapes will add a oval text shape anchored between the shapes with editable text.

Update: the text added to a line is not a new shape. It is a text box that sits over the middle of the line, is part of the line, and does not need to be moved (see Part 5).

Also in this spec: selected shapes move as a group with their links kept, lines get an arrowhead in the direction they were drawn, double-clicking a line deletes it, double-clicking the canvas toggles pan mode, and select all / copy / cut / paste / duplicate work.

This spec was corrected after it was implemented, so it matches the library behavior (`@xyflow/react` 12.12.1, `@liveblocks/react-flow` 3.25.2) and the code as built. Where the first draft was wrong, the correction and its reason are given in the step.

## Decisions Already Made

- Marquee (drag) selection on the empty canvas; middle/right-drag pans; double-clicking empty canvas toggles pan mode.
- A single click on a line adds a text box over it; a double-click on a line deletes it.
- The text box is an edge label, not a node or shape. It sits over the middle of the line, cannot be moved, and follows the line when shapes move. Nothing is created besides text on the edge.
- Every line has an arrowhead at its target end (the end it was dropped on).
- Self-connections and duplicate lines are allowed. Drawing the same connection between the same two handles twice gives one line (same edge id); different handles give two.
- Select, drag, pan mode, clipboard, and edit requests are local to each browser. They are never synced or saved.

## Build Order

Build and check each part before the next. After each part: `npx tsc --noEmit`, `npm run lint`, `npm run build`, then update `context/progress-tracker.md`.

1. Docs first (Part 7).
2. Arrowheads (Part 3).
3. Marquee, selection box style, hiding toolbars, group move, delete (Part 1).
4. Double-click delete and click-to-label (Parts 4 and 5).
5. Pan mode (Part 2).
6. Clipboard shortcuts and Enter-to-edit (Part 6).

## Implementation

Most changes are in `components/editor/canvas-flow.tsx`. Reuse the existing `useLiveblocksFlow` handlers (`onNodesChange`, `onEdgesChange`, `onDelete`) so every change syncs through Liveblocks. Put reusable logic in small modules rather than growing `canvas-flow.tsx`.

### Part 1. Marquee select, group move, delete

1. Enable marquee selection on `<ReactFlow>`:
   - `selectionOnDrag` (turned off while pan mode is on)
   - `panOnDrag={[1, 2]}` as a module constant, so left-drag selects and middle/right-drag pans
   - `selectionMode={SelectionMode.Partial}` (a shape partly inside the box is selected)
   - `zoomOnDoubleClick={false}`, because a double-click now toggles pan mode
   - leave scroll and pinch zoom alone
   - leave `multiSelectionKeyCode` at its default: Cmd on macOS, Ctrl elsewhere, click adds to the selection. Shift is React Flow's `selectionKeyCode` (Shift+drag draws a box); Shift+click does not add.

2. Style the selection box through React Flow's own CSS variables on the `<ReactFlow>` `style` prop, not by overriding its classes (React Flow's stylesheet is unlayered, so overrides in `globals.css` can lose the cascade):
   - `--xy-selection-background-color: var(--accent-primary-dim)`
   - `--xy-selection-border: 1px solid color-mix(in srgb, var(--accent-primary) 60%, transparent)`
   - use `--accent-primary` and `--accent-primary-dim` (not the shadcn `--accent` token, which is a neutral surface). No new colors.

3. Hide the color toolbar and `NodeResizer` handles while more than one node is selected. In `CanvasNodeView`, read a boolean from the React Flow store with `useStore` (selected node count greater than 1; a boolean means a node only re-renders when it flips) and pass `selected && !inMultiSelection` to both. This is the only change to node rendering. The shape keeps its selected outline.

4. Group move needs no new code. React Flow moves every selected node together and the Liveblocks hook already pauses history while dragging, so a group move is one undo step. Links stay attached: an edge between a moved and an unmoved shape stretches. Dragging the selection rectangle also moves the group. Arrow-key movement is out of scope (React Flow's own keyboard handling is left as is).

5. Delete keeps the existing window `Delete`/`Backspace` handler, with its logic in a `deleteSelection` function (also used by cut):
   - delete every selected node and every edge attached to a selected node (links are broken)
   - never delete a node that is not selected; it stays with its remaining edges
   - a selected edge on its own is deletable
   - go through the Liveblocks `onDelete({ nodes, edges })` (its `remove` changes are no-ops), one call, one undo step
   - keep the guard that ignores the key while typing in an input, textarea, select, or editable text
   - a marquee also selects every edge attached to a selected node, which fits this rule

### Part 2. Pan mode

1. Double-clicking the empty canvas toggles pan mode (hand tool) so people without a middle/right button, or on touch, can pan.
   - React Flow has no pane double-click prop. Put `onDoubleClick` on `<ReactFlow>` and act only when `event.target` has the class `react-flow__pane`. Nodes, lines, line labels, the selection rectangle, controls, and the mini map are ignored.
   - ignore the double-click while a shape from the panel is armed
   - in pan mode: `panOnDrag` is a module constant `[0, 1, 2]` (never `true`, which would break right-drag and context-menu handling) and `selectionOnDrag` is false
   - double-click again, or press `Escape` (not while typing), to leave pan mode
   - React Flow shows the grab cursor itself; add no cursor CSS
   - while pan mode is on, show a small non-interactive `Panel` at the top center with `role="status"` and the text "Pan mode · double-click or press Esc to exit". No toolbar button.
   - pan mode is local state and is not synced

### Part 3. Arrowheads

1. Set arrowheads once on `<ReactFlow>`:
   - `defaultEdgeOptions` as a module constant: `{ markerEnd: { type: MarkerType.ArrowClosed, width: 37.5, height: 37.5 }, interactionWidth: 20 }`. The arrowhead is 3x React Flow's default size (12.5), so it stays readable on the canvas.
   - React Flow merges `defaultEdgeOptions` into every edge when it renders (and the marker definitions read it), so drawn, saved, template, and pasted lines all get an arrow. Do not store `markerEnd` on edges, do not wrap `onConnect`, and do not patch edges when loading. The saved JSON format does not change (autosave does not save `markerEnd`).
   - direction: a connection's `source` is where the drag started and `target` where it was dropped (every handle is a source handle), so the arrow points the way the line was drawn.

2. The arrowhead and line share one color:
   - pass `defaultMarkerColor={null}` so the marker follows the CSS variable `--xy-edge-stroke` (a marker color of `null` on the marker itself falls back to React Flow's default grey instead)
   - set on the `style` prop: `--xy-edge-stroke: var(--text-muted)` and `--xy-edge-stroke-selected: var(--text-secondary)`
   - this replaces React Flow's dark default stroke (`#3e3e3e`, about 1.9:1 against the canvas), which could not meet a 3:1 contrast. `--text-muted` is about 5.2:1.
   - no path type or width change. `ui-context.md`'s smooth-step path and `#f8fafc` color remain a follow-up.

### Part 4. Double-click a line to delete it

1. Add `onEdgeDoubleClick`: cancel any pending label, then `onDelete({ nodes: [], edges: [edge] })`. The shapes stay.
2. Selecting a line for the Delete key needs Shift/Cmd/Ctrl-click, because a plain click starts adding a label.
3. `interactionWidth` is already 20 by default in React Flow; it is kept explicit in `defaultEdgeOptions`.

### Part 5. Click a line to add an editable text box

The text box is a label on the line, not a shape. No node is added, no line is split, and no new shape type exists.

1. Add `onEdgeClick`. React Flow calls it for both clicks of a double-click, so:
   - return when a panel shape is armed (`selectedShape`) or when Shift, Cmd, or Ctrl is held
   - clear any pending timer first
   - return when `event.detail > 1` (the second click of a double-click)
   - otherwise start one timer of `EDGE_SPLIT_DELAY_MS = 250` (a named constant) holding only the edge id; keep it in a ref and clear it on `onEdgeDoubleClick` and on unmount
   - a double-click with more than 250 ms between clicks will add a label instead of deleting; that is accepted

2. When the timer fires, re-read the edge with `flow.getEdge`. Do nothing if it is gone (deleted) or already has a label (`typeof data.label === "string"`). Otherwise call `flow.updateEdgeData(id, { label: "" })` (one edge update, one undo step) and ask it to open for typing with the local one-shot edit request.

3. The label is `data.label` on the edge. Type it in `types/canvas.ts` as `CanvasEdge = Edge<{ label?: string }, "canvasEdge">`. It lives in edge data, so it is saved by autosave (which keeps `data`) and synced like any other edge field. Edges still have no `type`; do not set `canvasEdge` on them.

4. Show the label with a custom edge component, `components/editor/canvas-edge.tsx`:
   - register it as `edgeTypes = { default: CanvasEdgeView }` (a module constant). Edges have no `type`, so they all resolve to `"default"`, and a user `default` entry replaces the built-in one for every line, drawn, saved, template, or pasted.
   - draw the same bezier path as the built-in default edge (`getBezierPath` and `BaseEdge`), passing through `markerEnd`, `style`, and `interactionWidth`, so lines look and behave as before
   - when `data.label` is a string, render an `<input>` through `EdgeLabelRenderer` at the path's midpoint (`labelX`, `labelY` from `getBezierPath`), centered, with `nodrag nopan` and `pointer-events: all`. It is not draggable and has no handles, so it stays on the line and follows it when shapes move.
   - style it from existing tokens (`rounded-full`, `border-border`, `bg-surface`, `text-foreground`, `text-xs`); placeholder "Label"; an `aria-label`
   - each keystroke updates `data.label` through `updateEdgeData`
   - Enter or Escape ends editing (blur). A label that is empty after blur is removed with `updateEdgeData(id, {}, { replace: true })`, so the line goes back to a plain line and can be clicked again.
   - the label's `onClick` and `onDoubleClick` call `stopPropagation`: React synthetic events bubble through the portal to the edge's own handlers, and a double-click on the text must not delete the line or add another label
   - keydown inside the input stops propagation (the window shortcuts also ignore inputs)
   - to open the box for typing after a click, use the local one-shot request from `lib/canvas-edit-request.ts`: `requestNodeEdit(edgeId)` stores the id; the edge component focuses its input in an effect once it has a label and a pending request, then clears it. Never store the request in edge data.

5. A line that already has a label ignores a plain click. Edit its text by clicking in the text box. Deleting the line (double-click, or Delete when selected, or deleting an attached shape) removes its label with it. Nothing needs to be reconnected.

### Part 6. Select all, copy, cut, paste, duplicate, Enter

1. `hooks/use-keyboard-shortcuts.ts` stays a key-to-action mapper. Its options gain `onSelectAll`, `onCopy`, `onCut`, `onPaste`, `onDuplicate`, `onEditLabel`, and `onEscape`. Each returns `true` when it handled the key, and the browser default is blocked only then. Actions are read through a ref so the window listener is not re-attached each render. The hook never touches Liveblocks.
   - `Cmd/Ctrl + A`: select all nodes and edges
   - `Cmd/Ctrl + C`: copy; `Cmd/Ctrl + X`: copy then `deleteSelection`; both are skipped while page text is selected
   - `Cmd/Ctrl + V`: paste; `Cmd/Ctrl + D`: duplicate (copy and paste), always blocking the browser bookmark shortcut on the canvas
   - `Enter` with no modifier, not repeated: edit the label of the one selected shape (through `requestNodeEdit`; `CanvasNodeView` listens for requests for its own id)
   - `Escape`: leave pan mode
   - all ignored while typing in a field. The copy/paste/Enter group applies only when focus is on the page body or inside the canvas (`.react-flow`), never on buttons, links, dialogs, or toolbars.

2. Select all and selection changes use local-only `select` changes through `onNodesChange` / `onEdgesChange`: nothing syncs, no undo step. Do not use `flow.setNodes`/`setEdges` for selection (in controlled mode they emit `replace` changes, and an empty array only emits `remove`, which the Liveblocks hook ignores).

3. Clipboard rules (`lib/canvas-clipboard.ts`):
   - the clipboard is a module-level variable (per tab); no system clipboard, nothing synced
   - copy builds plain copies of the selected nodes (no `selected`, `measured`, `dragging`) and only edges whose source and target are both copied nodes, with their `data` (so a line's text box is copied with its line). Do not use an edge's own `selected` flag, because React Flow also selects edges that touch a selected node.
   - paste gives new ids (`${shape}-${Date.now()}-${counter}`) and offsets nodes by 24 flow units, plus another 24 for each repeated paste of the same copy; edges are remapped to the new ids, use the same id format as lines drawn by hand (`xy-edge__...`), and keep their handles; the pasted nodes become the selection and the old selection is cleared
   - paste runs in one `room.batch` (one undo step); never mutate items returned by `flow`
   - paste with an empty clipboard does nothing; paste after the source was deleted still works

### Part 7. Docs

1. Before coding, update `context/ui-context.md` (Edge Style: arrowheads from `defaultEdgeOptions`, the line and arrow color tokens, line text boxes, and a Canvas Interactions list) and `context/architecture.md` (optional `data.label` on edges; nodes unchanged; local-only state is never synced or saved).
2. After each part's checks pass, update `context/progress-tracker.md`: the Current Goal line and a "22 Canvas Additional Features" entry that says what changed, its status ("Implemented" vs "Verified" as defined in the Status Key), deviations, and open questions.

## Scope Limits

- don’t change the existing Liveblocks setup or collaborative state
- don’t add version history or multiple snapshots per project
- don’t add AI generation logic
- don’t change node or shape rendering, except hiding the color toolbar and resize handles while more than one node is selected, and starting the label editor on request
- don’t add a node, a shape, or a new shape type for line text; it is an edge label only
- the one custom edge component (`canvas-edge.tsx`) keeps React Flow's default bezier path and exists only to show the text box; no path type change, no width change, no edge toolbar, and the line color changes only through the two `--xy-edge-stroke*` variables
- don’t add a system clipboard integration or cross-tab paste
- don’t block self-connections or duplicate lines, and don’t change how `onConnect` makes edge ids
- don’t store `markerEnd` on edges, don’t give edges a `type`, and don’t change the saved canvas JSON format beyond the optional `data.label` on edges
- don’t add a test runner

## Check When Done

- `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass.
- Dragging on empty canvas draws a selection box in the accent colors and selects every shape it touches; middle/right-drag still pans. Wheel and pinch still zoom. Dragging from a handle still draws a line. Dragging the minimap, controls, or shape panel never starts a marquee. Cmd/Ctrl-click adds a shape to the selection; Shift-drag also draws a box.
- Dragging one shape of a multi-selection moves the whole group; links stay attached and follow; one undo restores the original positions.
- With several shapes selected, Delete/Backspace removes only those shapes and every edge attached to them; unselected shapes remain; one undo restores them all.
- Color toolbars and resize handles are hidden while several shapes are selected and return for a single selection.
- A newly drawn line shows an arrowhead at the end where it was dropped; existing, template, and pasted lines show arrows too, in the same color as the line. After a reload the arrows are still there. Lines look the same as before (same bezier path).
- Clicking a line adds a text box over the middle of it and it is ready for typing. No node appears and the line is not split. The text box cannot be dragged, follows the line when a shape moves, and disappears when its text is cleared. One undo removes the label.
- Typing in the text box saves with the canvas (reload keeps it) and shows in a second browser. Double-clicking inside the text box does not delete the line.
- Double-clicking a line deletes it (its label with it) and never leaves a label behind.
- Double-clicking empty canvas toggles pan mode (status chip shown, left-drag pans); `Escape` or another double-click leaves it. Right-drag still pans in both modes.
- Select all, copy, cut, paste, and duplicate work; pasted groups keep only their internal links (and those lines' text); one undo removes a paste. `Enter` edits the selected shape's label.
- Changes are visible to a second browser in the same room (labels, arrows, group moves, deletes, pastes) and autosave still runs.

Edge cases to test by hand:
- marquee over empty space selects nothing and clears the selection
- marquee while panned and zoomed in and out selects the right shapes
- marquee that includes shapes whose lines have text boxes, then group move and group delete
- a panel shape armed, then a marquee drag or a pane double-click: nothing is placed and pan mode does not toggle
- clicking a line while a panel shape is armed does not add a label
- double-click on a line during the 250 ms delay never leaves both a deleted line and a label
- clicking a line that already has a label does nothing; clicking in the text box edits it
- a label left empty is removed on blur; a very long label stays on one line and grows without covering the page controls
- a self-connection and a second line between the same two shapes on different handles both get arrows and labels and can be deleted
- deleting or moving shapes while a collaborator edits a line's label in the same room
- two browsers adding a label to the same line at the same moment keep one working label
- paste with nothing copied does nothing; copy with text selected on the page copies the text, not the shapes
- reload after adding a label or pasting: the autosaved canvas matches the screen. After deleting every shape, a reload restores the last non-empty save (autosave never saves an empty canvas, spec 21).
- a canvas loaded on page open is on the undo stack, so a second undo may remove loaded content (existing behavior, not changed here)
- Cmd versus Ctrl shortcuts on macOS and Windows; pan mode on a touch device
