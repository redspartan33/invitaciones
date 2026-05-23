// Client for the public guestlist. Tries the Vercel serverless API first; if
// that's unavailable (e.g. local `vite dev`), falls back to localStorage so the
// flow works end-to-end in development.

export interface GuestEntry {
  id: string
  name: string
  message?: string
  createdAt: string
}

const LS_PREFIX = 'guestlist:'
const SUBMITTED_PREFIX = 'guestlist-submitted:'

function lsKey(slug: string) {
  return `${LS_PREFIX}${slug}`
}

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

function readLocal(slug: string): GuestEntry[] {
  try {
    const raw = window.localStorage.getItem(lsKey(slug))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal(slug: string, list: GuestEntry[]) {
  try {
    window.localStorage.setItem(lsKey(slug), JSON.stringify(list))
  } catch {
    // ignore quota errors
  }
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Initialize an empty guestlist on the server (best-effort). Always succeeds locally. */
export async function initGuestList(slug: string): Promise<void> {
  try {
    await fetch(`/api/guestlists/${slug}`, { method: 'PUT' })
  } catch {
    // ignore
  }
  // Ensure a local entry exists too so the dev fallback works immediately.
  if (window.localStorage.getItem(lsKey(slug)) === null) writeLocal(slug, [])
}

/** Append a guest entry. Returns true on any successful write (remote OR local). */
export async function submitGuestEntry(
  slug: string,
  payload: { name: string; message?: string },
): Promise<boolean> {
  const name = payload.name?.trim()
  if (!name) return false
  let remoteOk = false
  try {
    const res = await fetch(`/api/guestlists/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message: payload.message ?? '' }),
    })
    remoteOk = res.ok
  } catch {
    remoteOk = false
  }
  if (!remoteOk) {
    // Remote unavailable (vite dev, network blip): store locally so the entry
    // isn't lost and the guestlist view still shows it on this device.
    const entry: GuestEntry = {
      id: makeId(),
      name,
      message: payload.message?.trim() || '',
      createdAt: new Date().toISOString(),
    }
    const list = readLocal(slug)
    list.push(entry)
    writeLocal(slug, list)
  }
  markSubmitted(slug, name)
  return true
}

/** Read the full guestlist, merging server + local entries. */
export async function loadGuestList(slug: string): Promise<GuestEntry[]> {
  let remote: GuestEntry[] = []
  let remoteAvailable = false
  try {
    const res = await fetch(`/api/guestlists/${slug}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        remote = data
        remoteAvailable = true
      }
    }
  } catch {
    remoteAvailable = false
  }
  const local = readLocal(slug)
  if (!remoteAvailable) return local
  // Merge by id; remote wins on conflict, append any local-only entries
  // (entries written while the API was down).
  const byId = new Map<string, GuestEntry>()
  for (const e of remote) byId.set(e.id, e)
  for (const e of local) if (!byId.has(e.id)) byId.set(e.id, e)
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
