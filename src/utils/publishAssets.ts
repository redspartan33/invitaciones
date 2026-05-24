import type { Invitation, InvitationBlock } from '../types/invitation.types'

// When the editor lets users upload images via FileReader we end up with
// `data:image/...;base64,...` URIs embedded in the invitation JSON. Multiple
// of those (one per block, one per gallery photo, …) quickly blow past the
// platform's request body limit, so publish silently fails.
//
// Before saving the invitation to the registry we walk every known image
// field, upload base64 payloads to public blob storage via /api/assets, and
// replace them with the returned public URL. The serialized invitation then
// stays small no matter how many photos the user added.

const ASSETS_ENDPOINT = '/api/assets'

// 5 MB cap matches the server-side limit in /api/assets. We send raw binary
// (not base64-in-JSON) so the request body is the literal byte count of the
// image — no 33% inflation, no JSON parser to overflow.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

interface DecodedDataUri {
  bytes: Uint8Array
  contentType: string
}

function decodeDataUri(dataUri: string): DecodedDataUri | null {
  const match = /^data:([^;,]+)(?:;([^,]+))?,(.*)$/.exec(dataUri)
  if (!match) return null
  const contentType = (match[1] || 'application/octet-stream').trim()
  const isBase64 = (match[2] || '').includes('base64')
  const raw = match[3]
  try {
    if (isBase64) {
      const bin = atob(raw)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      return { bytes, contentType }
    }
    // url-encoded text payload (rare for images, but supported)
    const text = decodeURIComponent(raw)
    const bytes = new TextEncoder().encode(text)
    return { bytes, contentType }
  } catch {
    return null
  }
}

async function uploadDataUri(
  dataUri: string,
  folder: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const decoded = decodeDataUri(dataUri)
  if (!decoded) {
    return { ok: false, error: 'No se pudo interpretar una imagen embebida (formato data: inválido).' }
  }
  if (decoded.bytes.length > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Una imagen pesa ${(decoded.bytes.length / 1024 / 1024).toFixed(1)} MB (máx 5 MB). Usa una más ligera o pega una URL pública.`,
    }
  }

  const url = `${ASSETS_ENDPOINT}?folder=${encodeURIComponent(folder)}`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': decoded.contentType },
      // Wrap in Blob — Uint8Array's BufferSource overload is awkward with
      // TS's lib.dom.d.ts (rejects narrow ArrayBufferLike). Blob is always
      // accepted as fetch body and preserves the raw bytes.
      body: new Blob([new Uint8Array(decoded.bytes)], { type: decoded.contentType }),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'red sin conexión'
    return { ok: false, error: `Sin conexión al subir imágenes: ${msg}` }
  }
  if (!res.ok) {
    let detail = ''
    try {
      const body = (await res.json()) as { error?: string }
      detail = body.error || ''
    } catch {
      try {
        detail = await res.text()
      } catch {
        /* ignore */
      }
    }
    return {
      ok: false,
      error: `El servidor rechazó la imagen (HTTP ${res.status}${detail ? `: ${detail}` : ''}). Si pesa más de 5 MB, redúcela antes de publicar.`,
    }
  }
  let data: { url?: string }
  try {
    data = (await res.json()) as { url?: string }
  } catch {
    return { ok: false, error: 'Respuesta inválida del servidor al subir imagen.' }
  }
  if (typeof data.url !== 'string') {
    return { ok: false, error: 'El servidor no devolvió la URL de la imagen.' }
  }
  return { ok: true, url: data.url }
}

function isDataUri(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:')
}

// Keys we know are meant to hold image URLs across the entire invitation
// tree. `url` is included because gallery images use it; we still gate on
// isDataUri() so we won't touch ordinary links like rsvpLink / embedUrl /
// guestListLink.
const IMAGE_KEYS = new Set([
  'backgroundImage',
  'inspirationImage',
  'image',
  'logo',
  'favicon',
  'url',
])

/**
 * Walks the invitation and uploads every embedded `data:` image to public
 * blob storage. Returns a new Invitation with all `data:` URIs replaced by
 * public URLs.
 *
 * Throws on the first failed upload — the caller should surface the message
 * to the user so they understand publish couldn't complete.
 */
export async function extractAndUploadAssets(inv: Invitation): Promise<Invitation> {
  const folder = `inv-${inv.publicSlug || inv.id}`.replace(/[^a-zA-Z0-9_-]/g, '')

  // Deep-clone the parts we may mutate so we never modify the editor state
  // in place.
  const deepClone = <T,>(v: T): T => (v == null || typeof v !== 'object' ? v : (JSON.parse(JSON.stringify(v)) as T))

  const settings = deepClone(inv.globalSettings)
  const newBlocks: InvitationBlock[] = inv.blocks.map((b) => ({
    ...b,
    data: deepClone(b.data),
    style: b.style ? deepClone(b.style) : undefined,
  }))

  // Collect every (parent, key) pair that needs uploading first.
  const targets: { obj: Record<string, unknown>; key: string }[] = []
  const stack: unknown[] = [settings]
  for (const b of newBlocks) {
    stack.push(b.data)
    if (b.style) stack.push(b.style)
  }

  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object') continue
    if (Array.isArray(node)) {
      for (const item of node) if (item && typeof item === 'object') stack.push(item)
      continue
    }
    const obj = node as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      const v = obj[key]
      if (IMAGE_KEYS.has(key) && isDataUri(v)) {
        targets.push({ obj, key })
      } else if (v && typeof v === 'object') {
        stack.push(v)
      }
    }
  }

  if (targets.length === 0) {
    console.info('[publish] no embedded images — JSON has only URL references')
    return { ...inv, globalSettings: settings, blocks: newBlocks }
  }

  console.info(`[publish] uploading ${targets.length} embedded image(s) to /api/assets`)

  // Sequential upload: makes the failure point obvious in logs, and
  // protects against rate limits when there are many photos.
  for (let i = 0; i < targets.length; i++) {
    const { obj, key } = targets[i]
    const dataUri = obj[key] as string
    const result = await uploadDataUri(dataUri, folder)
    if (!result.ok) {
      console.error(`[publish] upload ${i + 1}/${targets.length} failed for "${key}":`, result.error)
      throw new Error(result.error)
    }
    obj[key] = result.url
    console.info(`[publish] uploaded ${i + 1}/${targets.length}: ${key} → ${result.url}`)
  }

  console.info(`[publish] all ${targets.length} image(s) uploaded successfully`)
  return { ...inv, globalSettings: settings, blocks: newBlocks }
}
