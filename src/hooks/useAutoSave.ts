import { useEffect, useRef, useState } from 'react'
import { INVITATION_PREFIX, useEditorStore } from '../store/editorStore'
import type { Invitation } from '../types/invitation.types'

export type SaveStatus = 'idle' | 'saving' | 'saved'

// Auto-saves the current invitation draft to localStorage on every change,
// debounced to ~600ms. Returns the current save status for UI hints.
export function useAutoSave(): { status: SaveStatus; lastSavedAt: Date | null } {
  const invitation = useEditorStore((s) => s.invitation)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const timer = useRef<number | null>(null)
  const firstRun = useRef(true)

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    setStatus('saving')
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      try {
        const payload: Invitation = invitation
        const key = INVITATION_PREFIX + invitation.id
        window.localStorage.setItem(key, JSON.stringify(payload))
        setStatus('saved')
        setLastSavedAt(new Date())
        window.setTimeout(() => setStatus('idle'), 1200)
      } catch {
        setStatus('idle')
      }
    }, 600)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [invitation])

  return { status, lastSavedAt }
}
