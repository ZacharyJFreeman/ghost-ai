Extras for the shape panel (builds on `12-shape-pannel.md`).

## Implementation

1. Click-to-place.
   - a left click on a shape icon highlights that shape
   - clicking the highlighted icon again clears the highlight
   - the next click inside the Liveblocks canvas places the highlighted shape at the click point, then clears the highlight
   - if the next click is outside the canvas, reset the highlight
   - clicks on the shape panel or the minimap don't place a shape
   - dragging a shape onto the canvas keeps working

2. Shape-specific node visuals.
   - replace the basic bordered rectangle renderer so each node matches its shape
   - rectangle: bordered box with rounded corners
   - diamond: outline stretched to the node size
   - circle: bordered box with fully rounded corners
   - pill: bordered box with fully rounded corners, wider than tall
   - cylinder: outline with elliptical top and bottom caps
   - hexagon: outline stretched to the node size
   - keep the label centered and the node handles on the middle of each side

## Check When Done

- Clicking an icon highlights it, and clicking it again clears it.
- The next canvas click places the highlighted shape and clears the highlight.
- A click outside the canvas clears the highlight without placing anything.
- Each placed node renders in the shape that was selected.
- `npm run build` passes without type errors.
