import { apiUrl } from './apiBase'
import {
  deleteGuestEntry,
  loadGuestList,
  submitGuestEntry,
  type DeleteResult,
  type GuestEntry,
  type SubmitResult,
} from './guestlistClient'
import { listFromRegistry } from './inviteRegistry'
import type { Invitation, RsvpInfoData } from '../types/invitation.types'

// ─────────────────────────────────────────────────────────────────────────────
// Pases personalizados
//
// A personal pass is a pre-filled confirmation link for ONE guest (or family):
// the host sets the name, the number of seats and an optional note, and the
// guest only adds an optional message and taps "Confirmar".
//
// Storage reuses the existing guestlist API so no backend change is needed:
// passes live in a sibling list `<guestListSlug>-pases`, one entry per pass.
//   entry.name    → guest name shown on the pass
//   entry.message → JSON `{ v, guests, note, inv }`
//   entry.id      → pass id (server-generated, non-guessable)
//
// The pass link is `/?inv=<publicSlug>&pase=<guestListSlug>.<passId>`. The
// guest's confirmation is appended to the regular guestlist with the message
// prefixed by `[pase:<id>]`, so the confirmados page can tell which pass it
// belongs to even if the backend drops unknown fields.
// ─────────────────────────────────────────────────────────────────────────────

const SLUG_RE = /^[A-Za-z0-9_-]{1,64}$/
const PASS_SUFFIX = '-pases'
const MARKER_RE = /^\[pase:([A-Za-z0-9_-]{1,64})\]\s?/

export const MAX_PASS_GUESTS = 50

export interface PersonalPass {
  id: string
  name: string
  guests: number
  note: string
  /** Public slug of the invitation the pass link opens. */
  invSlug?: string
  createdAt: string
}

interface StoredPassMessage {
  v: 1
  guests: number
  note?: string
  inv?: string
}

export function passListSlug(guestListSlug: string): string | null {
  const slug = `${guestListSlug}${PASS_SUFFIX}`
  return SLUG_RE.test(slug) ? slug : null
}

function clampGuests(n: unknown): number {
  const v = typeof n === 'number' ? n : parseInt(String(n ?? ''), 10)
  if (!Number.isFinite(v) || v < 1) return 1
  return Math.min(Math.round(v), MAX_PASS_GUESTS)
}

function entryToPass(entry: GuestEntry): PersonalPass | null {
  let meta: Partial<StoredPassMessage> = {}
  try {
    meta = JSON.parse(entry.message || '{}') as Partial<StoredPassMessage>
  } catch {
    return null
  }
  if (!meta || typeof meta !== 'object') return null
  return {
    id: entry.id,
    name: entry.name,
    guests: clampGuests(meta.guests),
    note: typeof meta.note === 'string' ? meta.note : '',
    invSlug: typeof meta.inv === 'string' && SLUG_RE.test(meta.inv) ? meta.inv : undefined,
    createdAt: entry.createdAt,
  }
}

// ── Links ────────────────────────────────────────────────────────────────────

export function passToken(guestListSlug: string, passId: string): string {
  return `${guestListSlug}.${passId}`
}

export function parsePassToken(token: string | null | undefined): { guestListSlug: string; passId: string } | null {
  if (!token) return null
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const guestListSlug = token.slice(0, dot)
  const passId = token.slice(dot + 1)
  if (!SLUG_RE.test(guestListSlug) || !SLUG_RE.test(passId)) return null
  return { guestListSlug, passId }
}

export function passUrl(invSlug: string, guestListSlug: string, passId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/?inv=${invSlug}&pase=${passToken(guestListSlug, passId)}`
}

export function passWhatsAppUrl(pass: PersonalPass, link: string): string {
  const seats = pass.guests === 1 ? '1 lugar' : `${pass.guests} lugares`
  const text = `¡Hola ${pass.name}! Te compartimos tu pase personalizado (${seats}). Confirma tu asistencia aquí: ${link}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export type PassLoadResult =
  | { ok: true; passes: PersonalPass[] }
  | { ok: false; detail?: string }

export async function loadPasses(guestListSlug: string): Promise<PassLoadResult> {
  const slug = passListSlug(guestListSlug)
  if (!slug) return { ok: true, passes: [] }
  const result = await loadGuestList(slug)
  if (!result.ok) return { ok: false, detail: result.detail }
  const passes = result.entries
    .map(entryToPass)
    .filter((p): p is PersonalPass => !!p)
  return { ok: true, passes }
}

export async function loadPass(guestListSlug: string, passId: string): Promise<PersonalPass | null | 'error'> {
  const result = await loadPasses(guestListSlug)
  if (!result.ok) return 'error'
  return result.passes.find((p) => p.id === passId) ?? null
}

export type CreatePassResult =
  | { ok: true; pass: PersonalPass }
  | { ok: false; reason: 'invalid-name' | 'network' | 'server'; detail?: string }

export async function createPass(
  guestListSlug: string,
  input: { name: string; guests: number; note?: string; invSlug?: string },
): Promise<CreatePassResult> {
  const slug = passListSlug(guestListSlug)
  const name = input.name.trim()
  if (!name) return { ok: false, reason: 'invalid-name' }
  if (!slug) return { ok: false, reason: 'server', detail: 'Slug de lista inválido' }
  const message: StoredPassMessage = {
    v: 1,
    guests: clampGuests(input.guests),
    note: input.note?.trim() || undefined,
    inv: input.invSlug,
  }
  let res: Response
  try {
    res = await fetch(apiUrl(`/api/guestlists/${slug}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message: JSON.stringify(message) }),
    })
  } catch {
    return { ok: false, reason: 'network' }
  }
  if (!res.ok) return { ok: false, reason: 'server', detail: `HTTP ${res.status}` }
  try {
    const body = (await res.json()) as { entry?: GuestEntry }
    const pass = body.entry ? entryToPass(body.entry) : null
    if (!pass) return { ok: false, reason: 'server', detail: 'Respuesta inesperada del servidor' }
    return { ok: true, pass }
  } catch {
    return { ok: false, reason: 'server', detail: 'Respuesta inesperada del servidor' }
  }
}

export function deletePass(guestListSlug: string, passId: string): Promise<DeleteResult> {
  const slug = passListSlug(guestListSlug)
  if (!slug) return Promise.resolve({ ok: true })
  return deleteGuestEntry(slug, passId)
}

// ── Confirmations ────────────────────────────────────────────────────────────

/** Split a guestlist entry into its pass id (if any) and the guest's own message. */
export function parseConfirmation(entry: GuestEntry): { passId?: string; message: string } {
  const raw = entry.message || ''
  const m = raw.match(MARKER_RE)
  if (m) return { passId: m[1], message: raw.slice(m[0].length) }
  if (entry.passId) return { passId: entry.passId, message: raw }
  return { message: raw }
}

export function findPassConfirmation(entries: GuestEntry[], passId: string): GuestEntry | undefined {
  return entries.find((e) => parseConfirmation(e).passId === passId)
}

const PASS_DEVICE_PREFIX = 'pase-confirmado:'

export function hasConfirmedPassOnDevice(passId: string): boolean {
  try {
    return !!window.localStorage.getItem(PASS_DEVICE_PREFIX + passId)
  } catch {
    return false
  }
}

export async function confirmPass(
  guestListSlug: string,
  pass: PersonalPass,
  guestMessage: string,
): Promise<SubmitResult> {
  const note = guestMessage.trim()
  const result = await submitGuestEntry(
    guestListSlug,
    {
      name: pass.name,
      message: `[pase:${pass.id}]${note ? ` ${note}` : ''}`,
      passId: pass.id,
      guests: pass.guests,
    },
    // The pass has its own lock below; don't block the regular RSVP form on
    // this device (the host often tests links on their own phone).
    { markDevice: false },
  )
  if (result.ok) {
    try {
      window.localStorage.setItem(PASS_DEVICE_PREFIX + pass.id, String(Date.now()))
      window.localStorage.setItem('guestlist-updated', JSON.stringify({ slug: guestListSlug, ts: Date.now() }))
    } catch {
      // ignore
    }
  }
  return result
}

// ── Resolving the invitation that owns a guestlist ───────────────────────────

/**
 * Find the public slug of the published invitation whose RSVP block owns this
 * guestlist. Used by the confirmados page (which only knows the list slug)
 * when its URL doesn't carry `&inv=`.
 */
export async function resolveInvitationSlugForGuestList(guestListSlug: string): Promise<string | undefined> {
  const all = await listFromRegistry()
  if (!all) return undefined
  const owns = (inv: Invitation) =>
    (inv.blocks ?? []).some(
      (b) => b.type === 'rsvp-info' && (b.data as RsvpInfoData)?.guestListSlug === guestListSlug,
    )
  const match = all.find((inv) => inv.publicSlug && inv.status === 'published' && owns(inv))
    ?? all.find((inv) => inv.publicSlug && owns(inv))
  return match?.publicSlug
}
