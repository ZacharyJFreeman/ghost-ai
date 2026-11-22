import { NODE_COLORS, type CanvasShape } from "@/types/canvas"

// Shapes drawn as an SVG outline that scales with the node (viewBox 100x100).
const SVG_SHAPES: Partial<Record<CanvasShape, string[]>> = {
  diamond: ["M50,0 L100,50 L50,100 L0,50 Z"],
  hexagon: ["M25,0 L75,0 L100,50 L75,100 L25,100 L0,50 Z"],
  cylinder: [
    "M0,12 A50,12 0 0 1 100,12 L100,88 A50,12 0 0 1 0,88 Z",
    "M0,12 A50,12 0 0 0 100,12",
  ],
}

// Shapes drawn with CSS: a bordered box with a corner radius.
const BOX_RADIUS: Partial<Record<CanvasShape, string>> = {
  rectangle: "0.375rem",
  circle: "9999px",
  pill: "9999px",
}

interface ShapeViewProps {
  shape: CanvasShape
  // The node fill from NODE_COLORS; the text and border color come from its pair.
  color: string
  selected?: boolean
  label?: string
}

// Renders a shape at the size of its parent. Borders are subtle at rest and
// full strength when selected. Used by canvas nodes and the drag preview.
export function ShapeView({ shape, color, selected = false, label = "" }: ShapeViewProps) {
  const text = NODE_COLORS.find((pair) => pair.fill === color)?.text ?? NODE_COLORS[0].text
  const border = selected ? text : `color-mix(in srgb, ${text} 45%, transparent)`
  const paths = SVG_SHAPES[shape]

  return (
    <div
      className="relative flex size-full items-center justify-center px-3 text-center text-sm"
      style={
        paths
          ? { color: text }
          : {
              color: text,
              backgroundColor: color,
              border: `1px solid ${border}`,
              borderRadius: BOX_RADIUS[shape],
            }
      }
    >
      {paths && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          {paths.map((d, index) => (
            <path
              key={d}
              d={d}
              fill={index === 0 ? color : "none"}
              stroke={border}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      )}
      <span className="relative">{label}</span>
    </div>
  )
}
