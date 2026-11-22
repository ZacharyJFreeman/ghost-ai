Add a bottom shape panel so users can drag shapes onto the canvas and create new nodes.

## Implementation

1. Add a floating pill-shaped toolbar at the bottom-center of the canvas.

2. Add draggable icon buttons for these shapes:
   - rectangle
   - diamond
   - circle
   - pill
   - cylinder
   - hexagon

   `CANVAS_SHAPES` in `types/canvas.ts` currently lacks `pill` and `hexagon`; add them so `CanvasShape` covers all six.

3. When dragging a shape, include the shape name and default size in the drag payload.

   Use sensible default sizes:
   - rectangles should be wider than tall
   - circles should be square
   - diamonds should be slightly larger so labels have room

4. Add `dragover` and `drop` handling to the canvas wrapper.

5. On drop:
   - read the dragged shape payload
   - convert the screen position to canvas coordinates using React Flow
   - create a new node at that position
   - use an empty label
   - use the default node color
   - use the dragged shape value

6. Generate each node ID using the shape name, timestamp, and a counter.

7. Add a basic renderer for the custom canvas node type so new nodes are visible.

   For this unit, render every shape as a simple bordered rectangle with the label centered.
   Shape-specific visuals will be added later.

8. Can you make the projects nav bar sit below the main header bar. Like the ai bar on the right

Currently it sits over and hides the open/collapse button

9. Make the AI nav bar move/feel the same as the right hand side. Don't change any functionality beyond the animation.

10. Centre the shape toolbar in the centre of the screen. Don't have it move when either the ai or project nav bars are openend or closed

11. Have the projects nav bar move over the top of the canvas. Not affecting the canvas opens/closes.

## Check When Done

- Shape drag payload includes the correct shape and size data.
- Drop logic creates new canvas nodes with the expected shape data.
- New nodes use the custom canvas node type.
- The sidebar toggle button stays in the same place when the sidebar is expanded.
- `npm run build` passes without type errors.
