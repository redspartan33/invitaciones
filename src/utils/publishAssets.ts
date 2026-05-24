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

// Soft client-side cap. Vercel Functions accept JSON bodies up to ~4.5 MB.
// A 2.5 MB raw image is ~3.4 MB base64-encoded, then ~3.5 MB once wrapped
// in JSON — comfortably under the limit. The picker enforces 5 MB raw, so
// we warn here for anything above ~2.7 MB which would push the request
// over the safe ceiling.
const SAFE_DATA_URI_BYTES = Math.floor(4 * 1024 * 1024)

async function uploadDataUri(
  dataUri: string,
  folder: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (dataUri.length > SAFE_DATA_URI_BYTES) {
    return {
      ok: false,
      error: `Una imagen ocuparía ${(dataUri.length / 1024 / 1024).toFixed(1)} MB codificada (máx 4 MB). Súbela más ligera o pega una URL pública.`,
    }
  }
  let res: Response
  try {
    res = await fetch(ASSETS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUri, folder }),
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
        detail = (await res.text()).slice(0, 200)
      } catch {
        /* ignore */
      }
    }
    return {
      ok: false,
      error:
        res.status === 413
          ? `Imagen demasiado grande para Vercel (HTTP 413). Usa una más ligera (máx ~3 MB).`
          : res.status === 404
          ? `El endpoint /api/assets no responde (HTTP 404). Probablemente el deploy aún no terminó.`
          : `El servidor rechazó la imagen (HTTP ${res.status}${detail ? `: ${detail}` : ''}).`,
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
