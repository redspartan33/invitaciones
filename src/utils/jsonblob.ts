import type { Invitation } from '../types/invitation.types'

// Free anonymous JSON storage (no API key, no setup). Returns short numeric
// IDs that we use as the public slug of the invitation. The same ID is the
// path on jsonblob.com, so any device can fetch the invitation directly.
const JSONBLOB_API = 'https://jsonblob.com/api/jsonBlob'

// JSONBlob IDs today are UUID v7 (`019e5200-c237-7465-aec5-2db5282312d5`,
// 36 chars). Older bins are 16-19 digit numerics. Accept both.
const JSONBLOB_ID_RE = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{10,20})$/i

export function isJsonBlobId(id: string): boolean {
  return JSONBLOB_ID_RE.test(id)
}

export async function uploadToJsonBlob(
  payload: Invitation,
  existingId?: string,
): Promise<string | null> {
  const isUpdate = !!(existingId && JSONBLOB_ID_RE.test(existingId))
  try {
    const res = await fetch(isUpdate ? `${JSONBLOB_API}/${existingId}` : JSONBLOB_API, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    if (isUpdate) return existingId!
    // Prefer the custom `X-jsonblob-id` header (UUID directly). Fall back to
    // parsing the `Location` header which jsonblob exposes via CORS.
    const xId = res.headers.get('X-jsonblob-id') || res.headers.get('X-jsonblob')
    if (xId && JSONBLOB_ID_RE.test(xId)) return xId
    const location = res.headers.get('Location') || ''
    const m = location.match(/jsonBlob\/([0-9a-fA-F-]+)/)
    if (m?.[1] && JSONBLOB_ID_RE.test(m[1])) return m[1]
    return null
  } catch {
    return null
  }
}

export async function fetchFromJsonBlob(id: string): Promise<Invitation | null> {
  if (!JSONBLOB_ID_RE.test(id)) return null
  try {
    const res = await fetch(`${JSONBLOB_API}/${id}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const parsed = (await res.json()) as Invitation
    if (!parsed?.id || !Array.isArray(parsed.blocks)) return null
    return parsed
  } catch {
    return null
  }
}

export async function deleteFromJsonBlob(id: string): Promise<void> {
  if (!JSONBLOB_ID_RE.test(id)) return
  try {
    await fetch(`${JSONBLOB_API}/${id}`, { method: 'DELETE' })
  } catch {
    /* ignore */
  }
}
