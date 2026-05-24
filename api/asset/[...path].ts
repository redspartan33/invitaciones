import { get } from '@vercel/blob'

// Public proxy for PRIVATE blob assets.
//
// The Vercel Blob store is configured as private-only, so the URLs the
// SDK returns require a `BLOB_READ_WRITE_TOKEN` header to be readable —
// browsers can't load them as <img src> directly. This endpoint accepts a
// path like `/api/asset/inv-foo/abc.png`, prepends `assets/`, fetches the
// blob via the SDK using our server-side token, and streams the bytes
// back with proper Content-Type + long cache headers.
//
// We URL-encode the asset path on write (`api/assets.ts`) and read it
// back as the catch-all `path` query param here.

interface VercelRequest {
  method?: string
  query: Record<string, string | string[] | undefined>
  body: unknown
  headers: Record<string, string | string[] | undefined>
}
interface VercelResponse {
  status: (code: number) => VercelResponse
  setHeader: (name: string, value: string) => void
  send: (body: string | Buffer) => VercelResponse
  json: (body: unknown) => VercelResponse
  end: (body?: string) => VercelResponse
}

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const raw = req.query.path
  const segments = Array.isArray(raw) ? raw : raw ? [raw] : []
  if (segments.length === 0) return res.status(400).json({ error: 'Missing path' })

  // Guard against path traversal — block any segment with `..`, leading
  // dots, slashes, or odd characters. The catch-all param is normally
  // safe but be defensive.
  for (const s of segments) {
    if (!/^[A-Za-z0-9._-]+$/.test(s) || s.startsWith('.')) {
      return res.status(400).json({ error: 'Invalid path segment' })
    }
  }

  const pathname = `assets/${segments.join('/')}`

  try {
    const result = await get(pathname, { access: 'private', useCache: true })
    if (!result || result.statusCode !== 200) {
      return res.status(404).json({ error: 'Not found' })
    }
    const lastSegment = segments[segments.length - 1]
    const ext = lastSegment.includes('.') ? lastSegment.split('.').pop()!.toLowerCase() : ''
    const inferredMime = MIME_BY_EXT[ext] || 'application/octet-stream'
    // Prefer the blob's stored content type when available; fall back to
    // the extension. (Different SDK versions surface it under different
    // keys.)
    const stored = (result as unknown as { contentType?: string }).contentType
    const contentType = stored && stored !== 'application/octet-stream' ? stored : inferredMime

    res.setHeader('Content-Type', contentType)
    // Assets are content-addressed (timestamp + random suffix in name), so
    // they're effectively immutable — long cache is safe and big perf win.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    const buf = Buffer.from(await new Response(result.stream).arrayBuffer())
    return res.status(200).send(buf)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    console.error('[asset proxy] failed for', pathname, ':', msg, e)
    return res.status(500).json({ error: msg })
  }
}
