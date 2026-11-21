"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  fetchShareData,
  inviteCollaborator,
  removeCollaborator,
} from "@/lib/client/collaborator-api"
import { errorMessage } from "@/lib/client/request"
import type { Collaborator, ShareOwner } from "@/lib/collaborators"

const COPIED_FEEDBACK_MS = 2000

export function useShareDialog(projectId: string) {
  const [isOpen, setIsOpen] = useState(false)
  const [owner, setOwner] = useState<ShareOwner | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
    }
  }, [])

  const open = useCallback(async () => {
    setIsOpen(true)
    setError(null)
    setIsLoading(true)
    try {
      const data = await fetchShareData(projectId)
      setOwner(data.owner)
      setCollaborators(data.collaborators)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const close = useCallback(() => {
    setIsOpen(false)
    setEmail("")
    setError(null)
  }, [])

  const invite = useCallback(async () => {
    if (isInviting || !email.trim()) return
    setIsInviting(true)
    setError(null)
    try {
      const data = await inviteCollaborator(projectId, email)
      setOwner(data.owner)
      setCollaborators(data.collaborators)
      setEmail("")
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setIsInviting(false)
    }
  }, [projectId, email, isInviting])

  const remove = useCallback(
    async (collaboratorId: string) => {
      if (removingId) return
      setRemovingId(collaboratorId)
      setError(null)
      try {
        await removeCollaborator(projectId, collaboratorId)
        setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId))
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setRemovingId(null)
      }
    },
    [projectId, removingId]
  )

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/editor/${projectId}`)
    } catch {
      setError("Couldn't copy the link. Copy it from the address bar instead.")
      return
    }
    setCopied(true)
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
  }, [projectId])

  return {
    isOpen,
    owner,
    collaborators,
    isLoading,
    isInviting,
    removingId,
    email,
    setEmail,
    error,
    copied,
    open,
    close,
    invite,
    remove,
    copyLink,
  }
}
