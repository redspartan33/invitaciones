import { apiUrl } from './apiBase'

// Privacy-conscious view tracking. We do NOT send any PII to the server —
// no IP, no UA string, no precise geo. The server only sees:
//   - a per-device random id (kept in localStorage so the same browser
//     looks the same across visits — used to compute unique-vs-total),
//   - device class derived from window.innerWidth,
//   - the browser's two-letter language,
//   - the currently selected menu variant,
//   - a coarse bucket of the referrer (whatsapp / instagram / search / …).
// Visit events are append-only and live next to the invitation, so the
// metrics dashboard can aggregate them per slug.

const VIEWER_ID_KEY = 'invitation-builder:viewer-id'
const SESSION_PREFIX = 'invitation-builder:view-recorded:'

function getViewerId(): string {
  try {
    const existing = window.localStorage.getItem(VIEWER_ID_KEY)
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing
  } catch {
    /* ignore */
  }
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  try {
    window.localStorage.setItem(VIEWER_ID_KEY, out)
  } catch {
    /* ignore */
  }
  return out
}

function deviceClass(): 'mobile' | 'tablet' | 'desktop' {
  const w = typeof window === 'undefined' ? 1024 : window.innerWidth
  if (w < 640) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

function referrerCategory(): 'direct' | 'whatsapp' | 'instagram' | 'facebook' | 'search' | 'other' {
  const ref = (typeof document === 'undefined' ? '' : document.referrer || '').toLowerCase()
  if (!ref) return 'direct'
  if (ref.includes('whatsapp') || ref.includes('wa.me') || ref.includes('api.whatsapp')) return 'whatsapp'
  if (ref.includes('instagram')) return 'instagram'
  if (ref.includes('facebook') || ref.includes('fb.com') || ref.includes('m.me')) return 'facebook'
  if (ref.includes('google') || ref.includes('bing') || ref.includes('duckduckgo') || ref.includes('yahoo')) return 'search'
  return 'other'
}

function browserLanguage(): string {
  if (typeof navigator === 'undefined') return ''
  const l = navigator.language || ''
  return l.slice(0, 5).toLowerCase()
}

/**
 * Records a single view for the given public slug. Idempotent within a
 * browser session (same tab won't record twice). Best-effort: failures are
 * swallowed because tracking should never break the actual page.
 */
export async function recordView(slug: string, opts: { variantId?: string | null } = {}): Promise<void> {
  if (!slug) return
  const sessionKey = SESSION_PREFIX + slug
  try {
    if (window.sessionStorage.getItem(sessionKey)) return
    window.sessionStorage.setItem(sessionKey, '1')
  } catch {
    // Storage blocked (Safari private mode etc.) — record anyway, this is
    // already a best-effort signal.
  }
  const payload = {
    viewerId: getViewerId(),
    device: deviceClass(),
    referrer: referrerCategory(),
    language: browserLanguage(),
    variantId: opts.variantId ?? null,
  }
  try {
    await fetch(apiUrl(`/api/views/${slug}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // keepalive so the request finishes if the user navigates away mid-flight.
      keepalive: true,
    })
  } catch {
    // ignore
  }
}

export interface ViewEvent {
  ts: string
  viewerId: string
  device: 'mobile' | 'tablet' | 'desktop'
  referrer: 'direct' | 'whatsapp' | 'instagram' | 'facebook' | 'search' | 'other'
  language: string
  variantId: string | null
}

export interface ViewsResponse {
  events: ViewEvent[]
  publicSlug?: string
}

/** Loads aggregated visit events for the metrics dashboard. */
export async function loadViewEvents(metricsSlug: string): Promise<ViewsResponse | null> {
  try {
    const res = await fetch(`${apiUrl(`/api/views/by-metrics/${metricsSlug}`)}?_=${Date.now()}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as ViewsResponse
  } catch {
    return null
  }
}
