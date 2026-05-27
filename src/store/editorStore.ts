import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type {
  BlockType,
  GlobalSettings,
  Invitation,
  InvitationBlock,
  Language,
  MenuVariant,
  ViewportMode,
} from '../types/invitation.types'
import { createBlock, createExampleInvitation, createExampleMenu } from '../utils/blockDefaults'
import { saveToRegistry, deleteFromRegistry, loadFromRegistry } from '../utils/inviteRegistry'
import { extractAndUploadAssets } from '../utils/publishAssets'
import { ensureAutoPreviewImage, hasShareableImage } from '../utils/generatePreviewImage'
import { buildTranslations } from '../utils/translation'
import { apiUrl } from '../utils/apiBase'

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
  setEnabledLanguages: (langs: Language[]) => void
  updateTitle: (title: string) => void
  resetDraft: () => void
  loadInvitation: (inv: Invitation) => void
  saveInvitationDraft: () => Promise<void>
  publishInvitation: () => Promise<string | null>
  unpublishInvitation: () => Promise<void>
  // menu variants
  enableMenuVariants: () => void
  disableMenuVariants: () => void
  addMenuVariant: (label: string, copyFromId?: string) => void
  renameMenuVariant: (id: string, label: string) => void
  deleteMenuVariant: (id: string) => void
  setActiveMenuVariant: (id: string) => void
  switchEditingMenuVariant: (id: string) => void
}

/** Apply a new `blocks` array to the invitation, syncing the editing
 *  variant entry too so menuVariants stays in lockstep with what's on
 *  the canvas. */
function mergeBlocks(inv: Invitation, blocks: InvitationBlock[]): Invitation {
  const next: Invitation = { ...inv, blocks, updatedAt: new Date().toISOString() }
  if (next.menuVariants && next.editingVariantId) {
    next.menuVariants = next.menuVariants.map((v) =>
      v.id === next.editingVariantId ? { ...v, blocks } : v,
    )
  }
  return next
}

function cloneBlocksWithFreshIds(blocks: InvitationBlock[]): InvitationBlock[] {
  return blocks.map((b) => ({
    ...b,
    id: uuid(),
    metadata: { createdAt: new Date().toISOString(), lastEdited: new Date().toISOString() },
  }))
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
      invitation: mergeBlocks(
        s.invitation,
        s.invitation.blocks.map((b) =>
          b.id === id
            ? {
                ...b,
                data: { ...b.data, ...data } as InvitationBlock['data'],
                metadata: { createdAt: b.metadata?.createdAt ?? new Date().toISOString(), lastEdited: new Date().toISOString() },
              }
            : b,
        ),
      ),
    })),

  updateBlockStyle: (id, style) =>
    set((s) => ({
      invitation: mergeBlocks(
        s.invitation,
        s.invitation.blocks.map((b) =>
          b.id === id ? { ...b, style: { ...b.style, ...style } } : b,
        ),
      ),
    })),

  toggleBlockVisibility: (id) =>
    set((s) => ({
      invitation: mergeBlocks(
        s.invitation,
        s.invitation.blocks.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)),
      ),
    })),

  addBlock: (type) =>
    set((s) => {
      const order = s.invitation.blocks.length
      const block = createBlock(type, order)
      return {
        invitation: mergeBlocks(s.invitation, [...s.invitation.blocks, block]),
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
        invitation: mergeBlocks(s.invitation, remaining),
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
        invitation: mergeBlocks(
          s.invitation,
          blocks.map((b, i) => ({ ...b, order: i })),
        ),
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
        invitation: mergeBlocks(
          s.invitation,
          blocks.map((b, i) => ({ ...b, order: i })),
        ),
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

  setEnabledLanguages: (langs) =>
    set((s) => {
      // 'es' is always implicitly the source; persist a normalized, de-duped list.
      const unique = Array.from(new Set<Language>(['es', ...langs]))
      return {
        invitation: {
          ...s.invitation,
          enabledLanguages: unique,
          updatedAt: new Date().toISOString(),
        },
      }
    }),

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
    // sharedLink points at the API's /share/<slug> endpoint, not the
    // frontend SPA. That endpoint serves an HTML page carrying og:title /
    // og:image so WhatsApp / iMessage / etc. render a link preview card
    // (title + first header image). Humans get bounced to the SPA via the
    // page's <meta http-equiv="refresh">. In dev the API base is empty so
    // we fall back to a same-origin URL the Vite proxy forwards.
    const sharedLink =
      apiUrl(`/share/${slug}`) || `${window.location.origin}/share/${slug}`

    let uploaded: Invitation
    try {
      uploaded = await extractAndUploadAssets({ ...inv, publicSlug: slug })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudieron subir las imágenes.'
      console.error('[publish] asset upload failed:', e)
      set({ publishMode: 'error', publishError: `Publicación fallida: ${msg}` })
      return null
    }

    // Build translations for every non-Spanish language enabled. We swallow
    // errors here so a flaky translation provider can't block the publish —
    // the page still works, the buttons just won't show foreign text yet.
    const targetLangs = (uploaded.enabledLanguages ?? []).filter((l) => l !== 'es')
    let translations = uploaded.translations
    if (targetLangs.length > 0) {
      try {
        translations = await buildTranslations(uploaded, targetLangs)
      } catch (e) {
        console.warn('[publish] translation build failed; continuing without translations', e)
      }
    } else {
      translations = undefined
    }

    // If the invitation doesn't carry any uploaded image, render a fallback
    // share card from the header (title + tagline + brand colors) so the
    // WhatsApp / iMessage link preview isn't a blank box. We do this AFTER
    // uploading the user's own assets so `hasShareableImage` sees them as
    // URLs, not data URIs. Failure here is non-fatal — publish still goes
    // through, the card just won't have a custom og:image.
    let autoPreviewImage = uploaded.globalSettings.autoPreviewImage
    if (!hasShareableImage(uploaded)) {
      const generated = await ensureAutoPreviewImage(uploaded)
      if (generated) autoPreviewImage = generated
    } else {
      // User added a real image since last publish — drop the stale auto
      // card so the new image takes over the og:image slot.
      autoPreviewImage = undefined
    }

    const published: Invitation = {
      ...uploaded,
      publicSlug: slug,
      status: 'published',
      updatedAt: now,
      sharedLink,
      translations,
      globalSettings: { ...uploaded.globalSettings, autoPreviewImage },
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

  enableMenuVariants: () =>
    set((s) => {
      if (s.invitation.menuVariants && s.invitation.menuVariants.length > 0) return s
      const first: MenuVariant = {
        id: uuid(),
        label: 'Principal',
        blocks: s.invitation.blocks,
      }
      return {
        invitation: {
          ...s.invitation,
          menuVariants: [first],
          activeVariantId: first.id,
          editingVariantId: first.id,
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  disableMenuVariants: () =>
    set((s) => {
      if (!s.invitation.menuVariants || s.invitation.menuVariants.length === 0) return s
      const active =
        s.invitation.menuVariants.find((v) => v.id === s.invitation.activeVariantId) ??
        s.invitation.menuVariants[0]
      return {
        invitation: {
          ...s.invitation,
          blocks: active.blocks,
          menuVariants: undefined,
          activeVariantId: undefined,
          editingVariantId: undefined,
          updatedAt: new Date().toISOString(),
        },
        selectedBlockId: null,
      }
    }),

  addMenuVariant: (label, copyFromId) =>
    set((s) => {
      // Persist current edits into the editing variant before adding.
      const synced = mergeBlocks(s.invitation, s.invitation.blocks)
      const existing = synced.menuVariants ?? []
      const source = copyFromId ? existing.find((v) => v.id === copyFromId) : undefined
      const seed: InvitationBlock[] = source
        ? cloneBlocksWithFreshIds(source.blocks)
        : []
      const v: MenuVariant = {
        id: uuid(),
        label: label.trim() || `Temporada ${existing.length + 1}`,
        blocks: seed,
      }
      return {
        invitation: {
          ...synced,
          menuVariants: [...existing, v],
          editingVariantId: v.id,
          activeVariantId: synced.activeVariantId ?? v.id,
          blocks: v.blocks,
          updatedAt: new Date().toISOString(),
        },
        selectedBlockId: null,
      }
    }),

  renameMenuVariant: (id, label) =>
    set((s) => {
      if (!s.invitation.menuVariants) return s
      return {
        invitation: {
          ...s.invitation,
          menuVariants: s.invitation.menuVariants.map((v) =>
            v.id === id ? { ...v, label: label.trim() || v.label } : v,
          ),
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  deleteMenuVariant: (id) =>
    set((s) => {
      const variants = s.invitation.menuVariants
      if (!variants || variants.length <= 1) return s
      const remaining = variants.filter((v) => v.id !== id)
      const editingId =
        s.invitation.editingVariantId === id ? remaining[0].id : s.invitation.editingVariantId
      const activeId =
        s.invitation.activeVariantId === id ? remaining[0].id : s.invitation.activeVariantId
      const editing = remaining.find((v) => v.id === editingId) ?? remaining[0]
      return {
        invitation: {
          ...s.invitation,
          menuVariants: remaining,
          editingVariantId: editing.id,
          activeVariantId: activeId,
          blocks: editing.blocks,
          updatedAt: new Date().toISOString(),
        },
        selectedBlockId: null,
      }
    }),

  setActiveMenuVariant: (id) =>
    set((s) => {
      if (!s.invitation.menuVariants?.some((v) => v.id === id)) return s
      return {
        invitation: {
          ...s.invitation,
          activeVariantId: id,
          updatedAt: new Date().toISOString(),
        },
      }
    }),

  switchEditingMenuVariant: (id) =>
    set((s) => {
      const variants = s.invitation.menuVariants
      if (!variants) return s
      const target = variants.find((v) => v.id === id)
      if (!target || id === s.invitation.editingVariantId) return s
      // Commit current edits to the outgoing variant first.
      const synced = mergeBlocks(s.invitation, s.invitation.blocks)
      return {
        invitation: {
          ...synced,
          editingVariantId: id,
          blocks: target.blocks,
          updatedAt: new Date().toISOString(),
        },
        selectedBlockId: null,
      }
    }),
}))

export async function loadPublishedFromServer(slug: string): Promise<Invitation | null> {
  return loadFromRegistry(slug)
}

export const EDITOR_STORAGE_KEY = STORAGE_KEY
