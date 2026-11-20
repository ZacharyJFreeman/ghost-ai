import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}
