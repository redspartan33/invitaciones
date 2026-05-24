// Client for the public guestlist. The server (Vercel Blob via /api) is the
// SOLE source of truth — entries are never persisted locally. This guarantees
// every device that opens the same link sees the exact same confirmed list.
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
    await fetch(`/api/guestlists/${slug}`, { method: 'PUT' })
  } catch {
    // ignore — the first submission will lazily create the file
  }
}

export type SubmitResult =
  | { ok: true; name: string }
  | { ok: false; reason: 'invalid-name' | 'network' | 'server' }

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
    res = await fetch(`/api/guestlists/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message: payload.message ?? '' }),
    })
  } catch {
    return { ok: false, reason: 'network' }
  }
  if (!res.ok) return { ok: false, reason: 'server' }
  markSubmitted(slug, name)
  return { ok: true, name }
}

export type LoadResult =
  | { ok: true; entries: GuestEntry[] }
  | { ok: false; reason: 'network' | 'server' | 'not-found' }

/** Read the full guestlist from the server. No local fallback. */
export async function loadGuestList(slug: string): Promise<LoadResult> {
  let res: Response
  try {
    // Cache-bust so the API response can't be served from a service-worker /
    // proxy / browser cache. The API itself bypasses the blob CDN cache via
    // head() + fetch with cache-bust on the storage URL.
    res = await fetch(`/api/guestlists/${slug}?_=${Date.now()}`, { cache: 'no-store' })
  } catch {
    return { ok: false, reason: 'network' }
  }
  if (res.status === 404) return { ok: true, entries: [] }
  if (!res.ok) return { ok: false, reason: 'server' }
  let data: unknown
  try {
    data = await res.json()
  } catch {
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
