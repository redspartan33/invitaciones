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

// Vercel serverless functions reject bodies above ~4.5 MB. The asset upload
// body is roughly `dataUri.length + ~50 bytes` of JSON wrapping, so the data
// URI itself must stay comfortably below 4 MB. We cap at 3.5 MB on the client
// to leave headroom for slow networks / proxies.
const MAX_DATA_URI_BYTES = Math.floor(3.5 * 1024 * 1024)

async function uploadDataUri(dataUri: string, folder: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (dataUri.length > MAX_DATA_URI_BYTES) {
    return {
      ok: false,
      error: `Una imagen pesa ${(dataUri.length / 1024 / 1024).toFixed(1)} MB (máx 3.5 MB). Usa una más ligera o pega una URL.`,
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
      // ignore non-JSON error bodies
    }
    return {
      ok: false,
      error: `El servidor rechazó la imagen (HTTP ${res.status}${detail ? `: ${detail}` : ''}).`,
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

// Keys we know are meant to hold image URLs across the entire invitation tree.
// `url` is included because gallery images use it; we still gate on isDataUri()
// so we won't touch ordinary links like rsvpLink/guestListLink.
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
  const folder = `inv-${inv.publicSlug || inv.id}`

  // Deep-clone the parts we may mutate so we never modify the editor state in
  // place. (Cheap because we only clone objects we walk; large strings are
  // shared by reference.)
  const deepClone = <T,>(v: T): T => (v == null || typeof v !== 'object' ? v : (JSON.parse(JSON.stringify(v)) as T))

  const settings = deepClone(inv.globalSettings)
  const newBlocks: InvitationBlock[] = inv.blocks.map((b) => ({
    ...b,
    data: deepClone(b.data),
    style: b.style ? deepClone(b.style) : undefined,
  }))

  // Collect every (parent, key) pair that needs uploading first so we can
  // report a precise count for logging.
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
    return { ...inv, globalSettings: settings, blocks: newBlocks }
  }

  console.info(`[publish] uploading ${targets.length} embedded image(s) to /api/assets`)

  // Upload in parallel, but fail fast on the first error so the user gets a
  // single clear message instead of a stampede of toasts.
  await Promise.all(
    targets.map(async ({ obj, key }) => {
      const dataUri = obj[key] as string
      const result = await uploadDataUri(dataUri, folder)
      if (!result.ok) {
        console.error(`[publish] upload failed for "${key}":`, result.error)
        throw new Error(result.error)
      }
      obj[key] = result.url
    }),
  )

  console.info(`[publish] all ${targets.length} image(s) uploaded successfully`)
  return { ...inv, globalSettings: settings, blocks: newBlocks }
}
