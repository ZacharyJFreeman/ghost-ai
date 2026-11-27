import { z } from "zod"

import { MAX_CHAT_MESSAGE_LENGTH } from "../types/chat"

// Limits keep a request (and the prompt built from it) a sane size.
export const MAX_SPEC_CHAT_MESSAGES = 200
export const MAX_SPEC_NODES = 500
export const MAX_SPEC_EDGES = 1000

const chatMessageSchema = z.object({
  sender: z.string().min(1).max(100),
  text: z.string().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
})

// Only what the spec needs from the canvas; other fields (position, size, color
// values, selection) are dropped on parse.
const nodeSchema = z.object({
  id: z.string().min(1).max(200),
  data: z
    .object({
      label: z.string().max(500).optional(),
      shape: z.string().max(50).optional(),
    })
    .optional(),
})

const edgeSchema = z.object({
  id: z.string().min(1).max(500),
  source: z.string().min(1).max(200),
  target: z.string().min(1).max(200),
  data: z.object({ label: z.string().max(500).optional() }).optional(),
})

// What the browser sends. The project ID is deliberately not here: the room ID is
// the project ID, and the route takes it from `roomId` after checking access.
export const specRequestSchema = z.object({
  roomId: z.string().min(1).max(200),
  chatHistory: z.array(chatMessageSchema).max(MAX_SPEC_CHAT_MESSAGES),
  nodes: z.array(nodeSchema).max(MAX_SPEC_NODES),
  edges: z.array(edgeSchema).max(MAX_SPEC_EDGES),
})

// What the task receives: the request plus the project ID the route derived.
export const specTaskPayloadSchema = specRequestSchema.extend({
  projectId: z.string().min(1).max(200),
})

export type SpecTaskPayload = z.input<typeof specTaskPayloadSchema>
export type ValidSpecInput = z.output<typeof specTaskPayloadSchema>

export const SPEC_SYSTEM_PROMPT = `You are Ghost AI, a senior technical architect. Generate a comprehensive technical specification from the architecture diagram (components and the connections between them) and the team's chat about it.

Structure the spec as follows:
1. **Overview** - What the system does and its key goals
2. **Architecture** - High-level architecture description based on the canvas
3. **Components** - Each node/service with its role and responsibilities
4. **Data Flow** - How data and requests move through the system
5. **Technology Choices** - Suggested technologies that fit the architecture
6. **Key Considerations** - Scalability, security, and performance notes

Base the Architecture, Components, and Data Flow sections only on the diagram and the chat: describe every component and connection that is in the diagram, use the chat for purpose and requirements, and do not invent components. Present technology choices as suggestions. Where the diagram or chat leaves something unclear, say so instead of guessing.

Write in clear, professional technical language. Use Markdown headers, bullet points, and code blocks where appropriate. Be specific and actionable. Output only the Markdown document.`

export function buildSpecPrompt(input: Pick<ValidSpecInput, "chatHistory" | "nodes" | "edges">): string {
  const labels = new Map(input.nodes.map((node) => [node.id, node.data?.label?.trim() || node.id]))

  const components = input.nodes.length
    ? input.nodes
        .map((node) => `- ${labels.get(node.id)} (${node.data?.shape ?? "rectangle"})`)
        .join("\n")
    : "(no components on the canvas)"

  const connections = input.edges.length
    ? input.edges
        .map((edge) => {
          const text = edge.data?.label?.trim()
          return `- ${labels.get(edge.source) ?? edge.source} -> ${labels.get(edge.target) ?? edge.target}${text ? ` (${text})` : ""}`
        })
        .join("\n")
    : "(no connections)"

  const chat = input.chatHistory.length
    ? input.chatHistory.map((message) => `${message.sender}: ${message.text}`).join("\n")
    : "(no chat yet)"

  return `Components:\n${components}\n\nConnections:\n${connections}\n\nChat:\n${chat}`
}
