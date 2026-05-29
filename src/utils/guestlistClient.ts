import { apiUrl } from './apiBase'

// Client for the public guestlist. The server (Express API on
// api.lamartinasma.com) is the SOLE source of truth — entries are never
// persisted locally. This guarantees every device that opens the same link
// sees the exact same confirmed list.
//
// The only thing kept in localStorage is the per-device "already submitted"
// marker, which is used to prevent the same browser from submitting twice.
// That marker is NOT used for showing other people's confirmations.

export interface GuestEntry {
  id: string
  name: string
  message?: string
  createdAt: string
}

const SUBMITTED_PREFIX = 'guestlist-submitted:'

function submittedKey(slug: string) {
  return `${SUBMITTED_PREFIX}${slug}`
}

/** True if this browser already submitted a confirmation for this guestlist. */
export function hasSubmitted(slug: string): boolean {
  try {
    return !!window.localStorage.getItem(submittedKey(slug))
  } catch {
    return false
  }
}

/** Returns the name this browser submitted, or undefined if it hasn't. */
export function getSubmittedName(slug: string): string | undefined {
  try {
    const raw = window.localStorage.getItem(submittedKey(slug))
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    return typeof parsed?.name === 'string' ? parsed.name : undefined
  } catch {
    return undefined
  }
}

function markSubmitted(slug: string, name: string) {
  try {
    window.localStorage.setItem(
      submittedKey(slug),
      JSON.stringify({ name, ts: Date.now() }),
    )
  } catch {
    // ignore
  }
}

/** Initialize an empty guestlist on the server. Resolves silently on failure. */
export async function initGuestList(slug: string): Promise<void> {
  try {
    await fetch(apiUrl(`/api/guestlists/${slug}`), { method: 'PUT' })
  } catch {
    // ignore — the first submission will lazily create the file
  }
}

export type SubmitResult =
  | { ok: true; name: string }
  | { ok: false; reason: 'invalid-name' | 'network' | 'server'; detail?: string }

async function extractErrorDetail(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as { error?: string }
    return body.error
  } catch {
    try {
      return (await res.text()).slice(0, 200)
    } catch {
      return undefined
    }
  }
}

/**
 * Append a guest entry. Server-only: returns ok:false on any failure.
 * Caller is responsible for showing an error to the guest.
 */
export async function submitGuestEntry(
  slug: string,
  payload: { name: string; message?: string },
): Promise<SubmitResult> {
  const name = payload.name?.trim()
  if (!name) return { ok: false, reason: 'invalid-name' }
  let res: Response
  try {
    res = await fetch(apiUrl(`/api/guestlists/${slug}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message: payload.message ?? '' }),
    })
  } catch (e) {
    console.error('[guestlist] submit network error', e)
    return { ok: false, reason: 'network' }
  }
  if (!res.ok) {
    const detail = await extractErrorDetail(res)
    console.error('[guestlist] submit failed', res.status, detail)
    return { ok: false, reason: 'server', detail: `HTTP ${res.status}${detail ? `: ${detail}` : ''}` }
  }
  markSubmitted(slug, name)
  return { ok: true, name }
}

export interface GuestListMeta {
  messageLabel: string
  messagePlaceholder: string
}

/**
 * Fetch the custom field labels the editor configured for this guestlist's RSVP
 * block. Falls back to empty strings on any failure — callers should then use
 * their own defaults. Never throws.
 */
export async function loadGuestListMeta(slug: string): Promise<GuestListMeta> {
  const empty: GuestListMeta = { messageLabel: '', messagePlaceholder: '' }
  try {
    const res = await fetch(apiUrl(`/api/guestlists/${slug}/meta?_=${Date.now()}`), { cache: 'no-store' })
    if (!res.ok) return empty
    const data = (await res.json()) as Partial<GuestListMeta>
    return {
      messageLabel: typeof data?.messageLabel === 'string' ? data.messageLabel : '',
      messagePlaceholder: typeof data?.messagePlaceholder === 'string' ? data.messagePlaceholder : '',
    }
  } catch {
    return empty
  }
}

export type LoadResult =
  | { ok: true; entries: GuestEntry[] }
  | { ok: false; reason: 'network' | 'server' | 'not-found'; detail?: string }

/** Read the full guestlist from the server. No local fallback. */
export async function loadGuestList(slug: string): Promise<LoadResult> {
  let res: Response
  try {
    // Cache-bust so the API response can't be served from a service-worker /
    // proxy / browser cache.
    res = await fetch(apiUrl(`/api/guestlists/${slug}?_=${Date.now()}`), { cache: 'no-store' })
  } catch (e) {
    console.error('[guestlist] load network error', e)
    return { ok: false, reason: 'network' }
  }
  if (res.status === 404) return { ok: true, entries: [] }
  if (!res.ok) {
    const detail = await extractErrorDetail(res)
    console.error('[guestlist] load failed', res.status, detail)
    return { ok: false, reason: 'server', detail: `HTTP ${res.status}${detail ? `: ${detail}` : ''}` }
  }
  let data: unknown
  try {
    data = await res.json()
  } catch (e) {
    console.error('[guestlist] load JSON parse failed', e)
    return { ok: false, reason: 'server' }
  }
  if (!Array.isArray(data)) return { ok: true, entries: [] }
  const entries = data.filter(
    (e): e is GuestEntry =>
      typeof e === 'object' && e !== null &&
      typeof (e as GuestEntry).id === 'string' &&
      typeof (e as GuestEntry).name === 'string',
  )
  entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return { ok: true, entries }
}
