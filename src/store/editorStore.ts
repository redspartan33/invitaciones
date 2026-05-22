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
const BACKEND_KEY = 'invitation-builder:backend'

export interface BackendConfig {
  baseUrl: string
  token: string
}

function loadBackend(): BackendConfig {
  if (typeof window === 'undefined') return { baseUrl: 'https://api.lamartinasma.com', token: '' }
  try {
    const raw = window.localStorage.getItem(BACKEND_KEY)
    if (raw) return { baseUrl: 'https://api.lamartinasma.com', token: '', ...(JSON.parse(raw) as Partial<BackendConfig>) }
  } catch {
    /* ignore */
  }
  return { baseUrl: 'https://api.lamartinasma.com', token: '' }
}

function persistBackend(b: BackendConfig) {
  try {
    window.localStorage.setItem(BACKEND_KEY, JSON.stringify(b))
  } catch {
    /* ignore */
  }
}

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
  activePanel: 'block' | 'colors' | 'fonts' | 'music' | 'details' | 'api' | null
  backend: BackendConfig
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
  publishInvitation: () => Promise<string>
  unpublishInvitation: () => Promise<void>
  setBackend: (patch: Partial<BackendConfig>) => void
  testBackend: () => Promise<{ ok: boolean; message: string }>
}

export const PUBLISHED_PREFIX = 'invitation-builder:published:'

// Slug corto (~9 chars base62, ≈ 53 bits) — no enumerable y mucho más corto
// que el UUID original. Suficiente para links privados.
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
  backend: loadBackend(),
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
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY)
    set({ invitation: createExampleInvitation(), selectedBlockId: null })
  },

  loadInvitation: (inv) => set({ invitation: inv, selectedBlockId: null }),

  publishInvitation: async () => {
    const { invitation: inv, backend } = get()
    const now = new Date().toISOString()
    const slug = inv.publicSlug || generateShortSlug()
    const sharedLink = `${window.location.origin}/?inv=${slug}`
    const published: Invitation = { ...inv, publicSlug: slug, status: 'published', updatedAt: now, sharedLink }

    try {
      window.localStorage.setItem(PUBLISHED_PREFIX + slug, JSON.stringify(published))
    } catch {
      /* ignore quota errors */
    }

    if (backend.baseUrl) {
      set({ publishMode: 'pushing', publishError: null })
      try {
        const res = await fetch(`${backend.baseUrl.replace(/\/$/, '')}/invitations/${slug}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(backend.token ? { Authorization: `Bearer ${backend.token}` } : {}),
          },
          body: JSON.stringify(published),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        set({ publishMode: 'pushed' })
        setTimeout(() => set((s) => (s.publishMode === 'pushed' ? { publishMode: 'idle' } : s)), 2000)
      } catch (e) {
        set({ publishMode: 'error', publishError: (e as Error).message })
      }
    }

    set({ invitation: published })
    return sharedLink
  },

  unpublishInvitation: async () => {
    const { invitation: inv, backend } = get()
    const key = inv.publicSlug || inv.id
    try {
      window.localStorage.removeItem(PUBLISHED_PREFIX + key)
    } catch {
      /* ignore */
    }
    if (backend.baseUrl) {
      try {
        await fetch(`${backend.baseUrl.replace(/\/$/, '')}/invitations/${key}`, {
          method: 'DELETE',
          headers: backend.token ? { Authorization: `Bearer ${backend.token}` } : {},
        })
      } catch {
        /* ignore */
      }
    }
    set({ invitation: { ...inv, status: 'draft', sharedLink: undefined, updatedAt: new Date().toISOString() } })
  },

  setBackend: (patch) => {
    const next = { ...get().backend, ...patch }
    persistBackend(next)
    set({ backend: next })
  },

  testBackend: async () => {
    const { backend } = get()
    if (!backend.baseUrl) return { ok: false, message: 'Falta la URL base' }
    try {
      const res = await fetch(`${backend.baseUrl.replace(/\/$/, '')}/health`, {
        headers: backend.token ? { Authorization: `Bearer ${backend.token}` } : {},
      })
      if (res.ok) return { ok: true, message: `Conexión OK (${res.status})` }
      return { ok: false, message: `HTTP ${res.status}` }
    } catch (e) {
      return { ok: false, message: (e as Error).message }
    }
  },
}))

export async function fetchPublishedFromBackend(id: string, backend: BackendConfig): Promise<Invitation | null> {
  if (!backend.baseUrl) return null
  try {
    const res = await fetch(`${backend.baseUrl.replace(/\/$/, '')}/invitations/${id}`, {
      headers: backend.token ? { Authorization: `Bearer ${backend.token}` } : {},
    })
    if (!res.ok) return null
    return (await res.json()) as Invitation
  } catch {
    return null
  }
}

export { loadBackend }

// Serialize an invitation into a URL-safe base64 string, so it can be shared
// via link across browsers without a backend.
export function encodeInvitation(inv: Invitation): string {
  const json = JSON.stringify(inv)
  const utf8 = unescape(encodeURIComponent(json))
  return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Comprime + base64url. Reduce el JSON ~70-80% respecto a base64 plano.
export async function encodeInvitationCompressed(inv: Invitation): Promise<string> {
  const json = JSON.stringify(inv)
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  const buf = new Uint8Array(await new Response(stream).arrayBuffer())
  let bin = ''
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function decodeInvitationCompressed(encoded: string): Promise<Invitation | null> {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    const json = await new Response(stream).text()
    const parsed = JSON.parse(json) as Invitation
    if (!parsed?.id || !Array.isArray(parsed.blocks)) return null
    return parsed
  } catch {
    return null
  }
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
