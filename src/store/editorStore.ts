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
}

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
}))

export const EDITOR_STORAGE_KEY = STORAGE_KEY
