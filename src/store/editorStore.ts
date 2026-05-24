import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type {
  BlockType,
  GlobalSettings,
  Invitation,
  InvitationBlock,
  ViewportMode,
} from '../types/invitation.types'
import { createBlock, createExampleInvitation, createExampleMenu } from '../utils/blockDefaults'
import { saveToRegistry, deleteFromRegistry, loadFromRegistry } from '../utils/inviteRegistry'
import { extractAndUploadAssets } from '../utils/publishAssets'

const STORAGE_KEY = 'invitation-builder:draft'

export const INVITATION_PREFIX = 'invitation-builder:inv:'

function loadInitial(): Invitation {
  if (typeof window === 'undefined') return createExampleInvitation()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Invitation
      if (parsed && parsed.id && Array.isArray(parsed.blocks)) return parsed
    }
  } catch {
    // ignore corrupt drafts
  }
  return createExampleInvitation()
}

export type PublishMode = 'idle' | 'pushing' | 'pushed' | 'error'

interface EditorState {
  invitation: Invitation
  selectedBlockId: string | null
  viewport: ViewportMode
  activePanel: 'block' | 'colors' | 'fonts' | 'music' | 'details' | null
  publishMode: PublishMode
  publishError: string | null
  // actions
  selectBlock: (id: string | null) => void
  setActivePanel: (p: EditorState['activePanel']) => void
  setViewport: (v: ViewportMode) => void
  updateBlockData: (id: string, data: Record<string, unknown>) => void
  updateBlockStyle: (id: string, style: Record<string, unknown>) => void
  toggleBlockVisibility: (id: string) => void
  addBlock: (type: BlockType) => void
  deleteBlock: (id: string) => void
  duplicateBlock: (id: string) => void
  reorderBlocks: (fromId: string, toId: string) => void
  updateGlobalSettings: (patch: Partial<GlobalSettings>) => void
  updateTitle: (title: string) => void
  resetDraft: () => void
  loadInvitation: (inv: Invitation) => void
  saveInvitationDraft: () => Promise<void>
  publishInvitation: () => Promise<string | null>
  unpublishInvitation: () => Promise<void>
}

// 9-char base62 slug (~53 bits of entropy). Short to share, not enumerable.
function generateShortSlug(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = new Uint8Array(9)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return out
}

export const useEditorStore = create<EditorState>((set, get) => ({
  invitation: loadInitial(),
  selectedBlockId: null,
  viewport: 'desktop',
  activePanel: 'block',
  publishMode: 'idle',
  publishError: null,

  selectBlock: (id) => set({ selectedBlockId: id, activePanel: id ? 'block' : get().activePanel }),
  setActivePanel: (p) => set({ activePanel: p }),
  setViewport: (v) => set({ viewport: v }),

  updateBlockData: (id, data) =>
    set((s) => ({
      invitation: {
        ...s.invitation,
        updatedAt: new Date().toISOString(),
        blocks: s.invitation.blocks.map((b) =>
          b.id === id
            ? {
                ...b,
                data: { ...b.data, ...data } as InvitationBlock['data'],
                metadata: { createdAt: b.metadata?.createdAt ?? new Date().toISOString(), lastEdited: new Date().toISOString() },
              }
            : b,
        ),
      },
    })),

  updateBlockStyle: (id, style) =>
    set((s) => ({
      invitation: {
        ...s.invitation,
        updatedAt: new Date().toISOString(),
        blocks: s.invitation.blocks.map((b) =>
          b.id === id ? { ...b, style: { ...b.style, ...style } } : b,
        ),
      },
    })),

  toggleBlockVisibility: (id) =>
    set((s) => ({
      invitation: {
        ...s.invitation,
        blocks: s.invitation.blocks.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)),
      },
    })),

  addBlock: (type) =>
    set((s) => {
      const order = s.invitation.blocks.length
      const block = createBlock(type, order)
      return {
        invitation: {
          ...s.invitation,
          updatedAt: new Date().toISOString(),
          blocks: [...s.invitation.blocks, block],
        },
        selectedBlockId: block.id,
        activePanel: 'block',
      }
    }),

  deleteBlock: (id) =>
    set((s) => {
      const remaining = s.invitation.blocks
        .filter((b) => b.id !== id)
        .map((b, i) => ({ ...b, order: i }))
      return {
        invitation: { ...s.invitation, updatedAt: new Date().toISOString(), blocks: remaining },
        selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
      }
    }),

  duplicateBlock: (id) =>
    set((s) => {
      const target = s.invitation.blocks.find((b) => b.id === id)
      if (!target) return s
      const clone: InvitationBlock = {
        ...target,
        id: uuid(),
        order: target.order + 1,
        metadata: { createdAt: new Date().toISOString(), lastEdited: new Date().toISOString() },
      }
      const blocks = [...s.invitation.blocks]
      blocks.splice(target.order + 1, 0, clone)
      return {
        invitation: {
          ...s.invitation,
          updatedAt: new Date().toISOString(),
          blocks: blocks.map((b, i) => ({ ...b, order: i })),
        },
        selectedBlockId: clone.id,
      }
    }),

  reorderBlocks: (fromId, toId) =>
    set((s) => {
      const blocks = [...s.invitation.blocks].sort((a, b) => a.order - b.order)
      const fromIdx = blocks.findIndex((b) => b.id === fromId)
      const toIdx = blocks.findIndex((b) => b.id === toId)
      if (fromIdx === -1 || toIdx === -1) return s
      const [moved] = blocks.splice(fromIdx, 1)
      blocks.splice(toIdx, 0, moved)
      return {
        invitation: {
          ...s.invitation,
          updatedAt: new Date().toISOString(),
          blocks: blocks.map((b, i) => ({ ...b, order: i })),
        },
      }
    }),

  updateGlobalSettings: (patch) =>
    set((s) => ({
      invitation: {
        ...s.invitation,
        updatedAt: new Date().toISOString(),
        globalSettings: { ...s.invitation.globalSettings, ...patch },
      },
    })),

  updateTitle: (title) =>
    set((s) => ({
      invitation: { ...s.invitation, title, updatedAt: new Date().toISOString() },
    })),

  resetDraft: () => {
    const { invitation } = get()
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(INVITATION_PREFIX + invitation.id)
    }
    const isMenu = invitation.kind === 'menu'
    const newInv = isMenu ? createExampleMenu() : createExampleInvitation()
    newInv.id = invitation.id
    set({ invitation: newInv, selectedBlockId: null })
  },

  loadInvitation: (inv) => set({ invitation: inv, selectedBlockId: null }),

  saveInvitationDraft: async () => {
    const { invitation: inv } = get()
    const draft: Invitation = { ...inv, updatedAt: new Date().toISOString() }
    try {
      window.localStorage.setItem(INVITATION_PREFIX + inv.id, JSON.stringify(draft))
    } catch { /* ignore quota errors */ }
    saveToRegistry(`draft-${inv.id}`, draft).catch(() => { /* best-effort */ })
    set({ invitation: draft })
  },

  // Atomic publish: only marks the invitation as published if the server
  // actually accepted the write. Otherwise the UI stays in 'error' so the
  // user knows the link is not valid yet.
  //
  // Before saving we upload any embedded base64 images to public blob
  // storage and swap them for URLs. Without this step the JSON payload
  // quickly exceeds Vercel's body limit and publish 413s, which the user
  // experiences as "no se publica y no respeta tipografías" (the publish
  // failed silently, so nothing — including font settings — persisted).
  publishInvitation: async () => {
    const { invitation: inv } = get()
    set({ publishMode: 'pushing', publishError: null })

    const slug = inv.publicSlug && /^[A-Za-z0-9_-]{1,64}$/.test(inv.publicSlug)
      ? inv.publicSlug
      : generateShortSlug()
    const now = new Date().toISOString()
    const sharedLink = `${window.location.origin}/?id=${slug}`

    let uploaded: Invitation
    try {
      uploaded = await extractAndUploadAssets({ ...inv, publicSlug: slug })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudieron subir las imágenes.'
      console.error('[publish] asset upload failed:', e)
      set({ publishMode: 'error', publishError: `Publicación fallida: ${msg}` })
      return null
    }

    const published: Invitation = {
      ...uploaded,
      publicSlug: slug,
      status: 'published',
      updatedAt: now,
      sharedLink,
    }

    const ok = await saveToRegistry(slug, published)
    if (!ok) {
      const payloadSize = JSON.stringify(published).length
      const sizeNote = payloadSize > 1024 * 1024
        ? ` (la invitación pesa ${(payloadSize / 1024 / 1024).toFixed(1)} MB — quizá tiene una imagen embebida muy grande)`
        : ''
      console.error('[publish] saveToRegistry returned not-ok. Payload size:', payloadSize)
      set({
        publishMode: 'error',
        publishError: `No se pudo guardar la invitación en el servidor${sizeNote}. Revisa /api/diag y vuelve a intentar.`,
      })
      return null
    }

    try {
      window.localStorage.setItem(INVITATION_PREFIX + inv.id, JSON.stringify(published))
    } catch { /* ignore quota errors */ }

    set({ invitation: published, publishMode: 'pushed' })
    setTimeout(() => set((s) => (s.publishMode === 'pushed' ? { publishMode: 'idle' } : s)), 2000)
    return sharedLink
  },

  unpublishInvitation: async () => {
    const { invitation: inv } = get()
    if (inv.publicSlug) await deleteFromRegistry(inv.publicSlug)
    const updated: Invitation = {
      ...inv,
      status: 'draft',
      sharedLink: undefined,
      updatedAt: new Date().toISOString(),
    }
    try {
      window.localStorage.setItem(INVITATION_PREFIX + inv.id, JSON.stringify(updated))
    } catch { /* ignore */ }
    saveToRegistry(`draft-${inv.id}`, updated).catch(() => { /* best-effort */ })
    set({ invitation: updated })
  },
}))

export async function loadPublishedFromServer(slug: string): Promise<Invitation | null> {
  return loadFromRegistry(slug)
}

export const EDITOR_STORAGE_KEY = STORAGE_KEY
