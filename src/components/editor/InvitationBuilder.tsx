import { useEffect, useRef, useState } from 'react'
import { Canvas } from './Canvas'
import { ConfigPanel } from './ConfigPanel'
import { EditorFootbar } from './EditorFootbar'
import { EditorHeader } from './EditorHeader'
import { GuideModal } from './GuideModal'
import { INVITATION_PREFIX, useEditorStore } from '../../store/editorStore'
import { createExampleInvitation, createExampleMenu } from '../../utils/blockDefaults'
import { createHannahMichaelMenu, createCocinotecaMenu } from '../../utils/menuTemplates'
import { loadFromRegistry, saveToRegistry } from '../../utils/inviteRegistry'
import type { Invitation } from '../../types/invitation.types'

// How often (ms) to autosave the draft to the server
const AUTOSAVE_INTERVAL = 15_000

export function InvitationBuilder() {
  const [showGuide, setShowGuide] = useState(false)
  const loadInvitation = useEditorStore((s) => s.loadInvitation)
  const invitation = useEditorStore((s) => s.invitation)
  const [loading, setLoading] = useState(true)
  const lastSavedRef = useRef<string>('')

  // ── Load invitation on mount ───────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const editId = params.get('edit')
    const newParam = params.get('new')
    const makeNew =
      newParam === 'menu'
        ? createExampleMenu
        : newParam === 'hannah-michael'
          ? createHannahMichaelMenu
          : newParam === 'cocinoteca'
            ? createCocinotecaMenu
            : createExampleInvitation

    async function boot() {
      if (editId) {
        const key = INVITATION_PREFIX + editId

        // 1. Read the cached copy (instant) and paint it right away so the
        //    first render is fast and offline still works.
        let local: Invitation | null = null
        const raw = window.localStorage.getItem(key)
        if (raw) {
          try {
            local = JSON.parse(raw) as Invitation
            loadInvitation(local)
            setLoading(false)
          } catch (e) {
            console.error('Failed to parse local invitation', e)
          }
        }

        // 2. Reconcile with the server copy (draft blob: `draft-<id>`). The
        //    cache used to win unconditionally, which meant a stale local
        //    draft could silently clobber newer server-side changes (e.g.
        //    dish images backfilled out-of-band) the moment autosave fired.
        //    Now we compare `updatedAt` and only keep the cache when it is
        //    at least as fresh as the server.
        const remote = await loadFromRegistry(`draft-${editId}`)
        if (remote) {
          const localTime = local ? Date.parse(local.updatedAt || '') || 0 : -1
          const remoteTime = Date.parse(remote.updatedAt || '') || 0
          if (!local || remoteTime > localTime) {
            try {
              window.localStorage.setItem(key, JSON.stringify(remote))
            } catch (e) {
              console.error('Failed to cache remote invitation', e)
            }
            loadInvitation(remote)
          }
          setLoading(false)
          return
        }

        // The cache covered us and the server had nothing — keep the cache.
        if (local) return

        // 3. Nothing found anywhere — create fresh with that ID
        const newInv = makeNew()
        newInv.id = editId
        window.localStorage.setItem(key, JSON.stringify(newInv))
        loadInvitation(newInv)
      } else {
        // No ID in URL → brand new document of the requested kind
        const newInv = makeNew()
        const key = INVITATION_PREFIX + newInv.id
        window.localStorage.setItem(key, JSON.stringify(newInv))
        loadInvitation(newInv)

        // Transparently update URL so reloads continue this session
        const nextParams = new URLSearchParams(window.location.search)
        nextParams.set('edit', newInv.id)
        nextParams.delete('new')
        window.history.replaceState({}, '', `/?${nextParams.toString()}`)
      }
      setLoading(false)
    }

    boot()
  }, [loadInvitation])

  // ── Autosave draft to server every AUTOSAVE_INTERVAL ms ───────────────────
  useEffect(() => {
    if (loading) return
    const id = setInterval(() => {
      const inv = useEditorStore.getState().invitation
      const snapshot = JSON.stringify(inv)
      // Only save if something changed since the last autosave
      if (snapshot === lastSavedRef.current) return
      lastSavedRef.current = snapshot
      const draftSlug = `draft-${inv.id}`
      // Best-effort, non-blocking
      saveToRegistry(draftSlug, inv).catch(() => { /* ignore */ })
      // Also keep localStorage fresh
      try {
        window.localStorage.setItem(INVITATION_PREFIX + inv.id, snapshot)
      } catch { /* ignore */ }
    }, AUTOSAVE_INTERVAL)
    return () => clearInterval(id)
  }, [loading])

  // ── Save on unmount (navigation away) ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (loading) return
      const inv = useEditorStore.getState().invitation
      const snapshot = JSON.stringify(inv)
      if (snapshot === lastSavedRef.current) return
      const draftSlug = `draft-${inv.id}`
      saveToRegistry(draftSlug, inv).catch(() => { /* ignore */ })
      try {
        window.localStorage.setItem(INVITATION_PREFIX + inv.id, snapshot)
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-sm text-ink-500 font-medium">
        <span className="animate-pulse">Cargando editor de invitaciones…</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <EditorHeader />
      <div className="flex flex-1 overflow-hidden">
        <Canvas />
        <ConfigPanel />
      </div>
      <EditorFootbar onShowGuide={() => setShowGuide(true)} />
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </div>
  )
}
