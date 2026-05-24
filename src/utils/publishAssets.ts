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

async function uploadDataUri(dataUri: string, folder: string): Promise<string | null> {
  try {
    const res = await fetch(ASSETS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUri, folder }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { url?: string }
    return typeof data.url === 'string' ? data.url : null
  } catch {
    return null
  }
}

function isDataUri(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:')
}

/**
 * Walks the invitation and uploads every embedded `data:` image to public
 * blob storage. Returns a new Invitation with all `data:` URIs replaced by
 * public URLs.
 *
 * Throws on the first failed upload — the caller should surface this to the
 * user so they understand publish couldn't complete.
 */
export async function extractAndUploadAssets(inv: Invitation): Promise<Invitation> {
  const folder = `inv-${inv.publicSlug || inv.id}`

  // Walk a shallow object/array tree and replace any `data:` string we find
  // in known image-bearing keys. Uploads happen in parallel.
  const uploads: Promise<void>[] = []
  const stack: unknown[] = []

  // Track the GlobalSettings image fields
  const settings = { ...inv.globalSettings }
  stack.push(settings)

  const newBlocks: InvitationBlock[] = inv.blocks.map((b) => ({
    ...b,
    data: { ...(b.data as object) } as InvitationBlock['data'],
    style: b.style ? { ...b.style } : undefined,
  }))
  for (const b of newBlocks) {
    stack.push(b.data)
    if (b.style) stack.push(b.style)
  }

  const IMAGE_KEYS = new Set([
    'backgroundImage',
    'inspirationImage',
    'image',
    'logo',
    'favicon',
    'url', // gallery images
    // gift-registry items use `image`; menu images use `image` too
  ])

  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object') continue
    if (Array.isArray(node)) {
      for (const item of node) {
        if (item && typeof item === 'object') stack.push(item)
      }
      continue
    }
    const obj = node as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      const v = obj[key]
      if (IMAGE_KEYS.has(key) && isDataUri(v)) {
        const captured = v
        uploads.push(
          (async () => {
            const url = await uploadDataUri(captured, folder)
            if (!url) {
              throw new Error(`No se pudo subir una imagen (${key}). Verifica tu conexión y vuelve a intentar.`)
            }
            obj[key] = url
          })(),
        )
      } else if (v && typeof v === 'object') {
        stack.push(v)
      }
    }
  }

  await Promise.all(uploads)

  return { ...inv, globalSettings: settings, blocks: newBlocks }
}
