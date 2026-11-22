import {
  DEFAULT_SHAPE_SIZES,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasShape,
} from "@/types/canvas"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

type Side = "top" | "right" | "bottom" | "left"

// Palette pairs by name, so template data reads as "blue" instead of an index.
const COLOR = {
  neutral: NODE_COLORS[0].fill,
  blue: NODE_COLORS[1].fill,
  purple: NODE_COLORS[2].fill,
  orange: NODE_COLORS[3].fill,
  red: NODE_COLORS[4].fill,
  pink: NODE_COLORS[5].fill,
  green: NODE_COLORS[6].fill,
  teal: NODE_COLORS[7].fill,
}

function node(
  id: string,
  shape: CanvasShape,
  label: string,
  x: number,
  y: number,
  color: string,
): CanvasNode {
  const { width, height } = DEFAULT_SHAPE_SIZES[shape]
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width,
    height,
    data: { label, color, shape },
  }
}

function edge(source: string, target: string, from: Side = "right", to: Side = "left"): CanvasEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    sourceHandle: from,
    targetHandle: to,
  }
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description: "An API gateway routing to independent services, each with its own data store.",
  nodes: [
    node("client", "pill", "Client", 0, 140, COLOR.neutral),
    node("gateway", "rectangle", "API Gateway", 260, 140, COLOR.blue),
    node("auth", "rectangle", "Auth Service", 560, 0, COLOR.purple),
    node("orders", "rectangle", "Order Service", 560, 140, COLOR.purple),
    node("catalog", "rectangle", "Catalog Service", 560, 280, COLOR.purple),
    node("auth-db", "cylinder", "Users DB", 860, -20, COLOR.teal),
    node("orders-db", "cylinder", "Orders DB", 860, 120, COLOR.teal),
    node("catalog-db", "cylinder", "Catalog DB", 860, 260, COLOR.teal),
  ],
  edges: [
    edge("client", "gateway"),
    edge("gateway", "auth"),
    edge("gateway", "orders"),
    edge("gateway", "catalog"),
    edge("auth", "auth-db"),
    edge("orders", "orders-db"),
    edge("catalog", "catalog-db"),
  ],
}

const cicdPipeline: CanvasTemplate = {
  id: "ci-cd-pipeline",
  name: "CI/CD Pipeline",
  description: "Commit to production: build, test, a quality gate, then staged deploys.",
  nodes: [
    node("commit", "pill", "Commit", 0, 120, COLOR.neutral),
    node("build", "rectangle", "Build", 240, 120, COLOR.blue),
    node("test", "rectangle", "Test", 480, 120, COLOR.blue),
    node("gate", "diamond", "Passed?", 720, 90, COLOR.orange),
    node("staging", "rectangle", "Deploy to Staging", 1000, 120, COLOR.green),
    node("production", "rectangle", "Deploy to Production", 1240, 120, COLOR.green),
    node("notify", "pill", "Notify Team", 700, 320, COLOR.red),
  ],
  edges: [
    edge("commit", "build"),
    edge("build", "test"),
    edge("test", "gate"),
    edge("gate", "staging"),
    edge("staging", "production"),
    edge("gate", "notify", "bottom", "top"),
  ],
}

const eventDriven: CanvasTemplate = {
  id: "event-driven-system",
  name: "Event-Driven System",
  description: "Producers publish to an event bus that fans out to independent consumers.",
  nodes: [
    node("orders", "rectangle", "Order Service", 0, 0, COLOR.purple),
    node("payments", "rectangle", "Payment Service", 0, 160, COLOR.purple),
    node("bus", "hexagon", "Event Bus", 320, 60, COLOR.orange),
    node("inventory", "rectangle", "Inventory", 660, -60, COLOR.blue),
    node("email", "rectangle", "Email Notifier", 660, 100, COLOR.blue),
    node("analytics", "rectangle", "Analytics", 660, 260, COLOR.blue),
    node("warehouse", "cylinder", "Event Store", 320, 280, COLOR.teal),
  ],
  edges: [
    edge("orders", "bus"),
    edge("payments", "bus"),
    edge("bus", "inventory"),
    edge("bus", "email"),
    edge("bus", "analytics"),
    edge("bus", "warehouse", "bottom", "top"),
  ],
}

export const CANVAS_TEMPLATES: readonly CanvasTemplate[] = [microservices, cicdPipeline, eventDriven]
