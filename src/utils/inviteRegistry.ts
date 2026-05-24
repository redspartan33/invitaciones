import type { Invitation } from '../types/invitation.types'

// Persistent registry backed by Vercel Blob via our own serverless API.
// Each invitation is stored as a public JSON blob at `inv/<slug>.json`.
//
// In local development (where /api is not available) every function falls back
// to a no-op / null so the rest of the app continues working with localStorage.

const API_BASE = '/api/invitations'

// ── helpers ──────────────────────────────────────────────────────────────────

function invitationUrl(slug: string) {
  return `${API_BASE}/${slug}`
}

// ── public API ────────────────────────────────────────────────────────────────

/** Saves (creates or updates) an invitation in the remote store. */
export async function saveToRegistry(slug: string, inv: Invitation): Promise<boolean> {
  try {
    const res = await fetch(invitationUrl(slug), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inv),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Loads a single invitation by its public slug from the remote store. */
export async function loadFromRegistry(slug: string): Promise<Invitation | null> {
  try {
    // Append a cache-bust query param so intermediate proxies (browser,
    // service worker, CDN) can't serve a stale version after publish.
    const res = await fetch(`${invitationUrl(slug)}?_=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as Invitation
  } catch {
    return null
  }
}

/** Removes an invitation from the remote store. */
export async function deleteFromRegistry(slug: string): Promise<boolean> {
  try {
    const res = await fetch(invitationUrl(slug), { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Returns the full list of all invitations stored remotely.
 * Returns null if the endpoint is unreachable (e.g. local dev without Vercel).
 */
export async function listFromRegistry(): Promise<Invitation[] | null> {
  try {
    const res = await fetch(`${API_BASE}/index?_=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as Invitation[]
    if (!Array.isArray(data)) return null
    return data
  } catch {
    return null
  }
}
