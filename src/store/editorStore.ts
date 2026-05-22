import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type {
  BlockType,
  GlobalSettings,
  Invitation,
  InvitationBlock,
  ViewportMode,
} from '../types/invitation.types'
import { createBlock, createExampleInvitation } from '../utils/blockDefaults'

const STORAGE_KEY = 'invitation-builder:draft'

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

interface EditorState {
  invitation: Invitation
  selectedBlockId: string | null
  viewport: ViewportMode
  activePanel: 'block' | 'colors' | 'fonts' | 'music' | 'details' | null
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
  publishInvitation: () => string
  unpublishInvitation: () => void
}

export const PUBLISHED_PREFIX = 'invitation-builder:published:'

export const useEditorStore = create<EditorState>((set, get) => ({
  invitation: loadInitial(),
  selectedBlockId: null,
  viewport: 'desktop',
  activePanel: 'block',

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
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY)
    set({ invitation: createExampleInvitation(), selectedBlockId: null })
  },

  loadInvitation: (inv) => set({ invitation: inv, selectedBlockId: null }),

  publishInvitation: () => {
    const inv = get().invitation
    const now = new Date().toISOString()
    const sharedLink = `${window.location.origin}/?inv=${inv.id}`
    const published: Invitation = { ...inv, status: 'published', updatedAt: now, sharedLink }
    try {
      window.localStorage.setItem(PUBLISHED_PREFIX + inv.id, JSON.stringify(published))
    } catch {
      /* ignore quota errors */
    }
    set({ invitation: published })
    return sharedLink
  },

  unpublishInvitation: () => {
    const inv = get().invitation
    try {
      window.localStorage.removeItem(PUBLISHED_PREFIX + inv.id)
    } catch {
      /* ignore */
    }
    set({ invitation: { ...inv, status: 'draft', sharedLink: undefined, updatedAt: new Date().toISOString() } })
  },
}))

// Serialize an invitation into a URL-safe base64 string, so it can be shared
// via link across browsers without a backend.
export function encodeInvitation(inv: Invitation): string {
  const json = JSON.stringify(inv)
  const utf8 = unescape(encodeURIComponent(json))
  return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeInvitation(encoded: string): Invitation | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const utf8 = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
    const json = decodeURIComponent(escape(utf8))
    const parsed = JSON.parse(json) as Invitation
    if (!parsed?.id || !Array.isArray(parsed.blocks)) return null
    return parsed
  } catch {
    return null
  }
}

export function loadPublishedById(id: string): Invitation | null {
  try {
    const raw = window.localStorage.getItem(PUBLISHED_PREFIX + id)
    if (!raw) return null
    return JSON.parse(raw) as Invitation
  } catch {
    return null
  }
}

export const EDITOR_STORAGE_KEY = STORAGE_KEY
