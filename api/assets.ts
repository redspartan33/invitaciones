import { put } from '@vercel/blob'

// Uploads a base64-encoded image (data: URI) to PRIVATE blob storage and
// returns a public URL that proxies through `/api/asset/<pathname>` so
// browsers can fetch it as if it were a normal image.
//
// Why private + proxy instead of just public?
//   The user's Vercel Blob store is configured as private-only ("Cannot
//   use public access on a private store"), so `access:'public'` always
//   fails. We store everything privately and serve via a small proxy
//   endpoint that uses BLOB_READ_WRITE_TOKEN to fetch the bytes.
//
// Body: { dataUri: "data:image/...;base64,...", folder: "inv-<slug>" }

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

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')
}

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
}

function sanitizeSegment(s: string): string {
  return (s || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'misc'
}

function parseDataUri(dataUri: string): { contentType: string; bytes: Buffer } | null {
  if (!dataUri.startsWith('data:')) return null
  const commaIdx = dataUri.indexOf(',')
  if (commaIdx < 6) return null
  const meta = dataUri.slice(5, commaIdx)
  const isBase64 = meta.endsWith(';base64')
  const contentType = (isBase64 ? meta.slice(0, -7) : meta).trim() || 'application/octet-stream'
  const rawBody = dataUri.slice(commaIdx + 1)
  try {
    const bytes = isBase64 ? Buffer.from(rawBody, 'base64') : Buffer.from(decodeURIComponent(rawBody), 'utf8')
    return { contentType: contentType.toLowerCase(), bytes }
  } catch {
    return null
  }
}

// Return a SAME-ORIGIN relative URL pointing at the proxy. Relative is
// safer than absolute here: it works identically on `<host>.vercel.app`,
// on custom domains, on deploy previews, and on `localhost` — no
// host-mismatch when an invitation is published from one URL and later
// viewed from another.
function publicProxyUrl(_req: VercelRequest, pathname: string): string {
  // pathname is like "assets/<folder>/<file.ext>"; route is /api/asset/...
  const tail = pathname.startsWith('assets/') ? pathname.slice('assets/'.length) : pathname
  return `/api/asset/${tail}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  console.info('[assets] received POST')

  let payload: { dataUri?: string; folder?: string } = {}
  try {
    if (typeof req.body === 'string') {
      payload = JSON.parse(req.body)
    } else if (req.body && typeof req.body === 'object') {
      payload = req.body as { dataUri?: string; folder?: string }
    } else {
      return res.status(400).json({ error: 'Missing JSON body' })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'parse error'
    return res.status(400).json({ error: `Invalid JSON body: ${msg}` })
  }

  const dataUri = payload.dataUri
  const folder = sanitizeSegment(payload.folder || '')
  if (!dataUri || typeof dataUri !== 'string') {
    return res.status(400).json({ error: 'Missing dataUri' })
  }

  console.info(`[assets] payload: folder=${folder}, dataUri.length=${dataUri.length}`)

  const decoded = parseDataUri(dataUri)
  if (!decoded) {
    return res.status(400).json({ error: 'Could not parse data URI' })
  }
  if (decoded.bytes.length === 0) return res.status(400).json({ error: 'Empty image' })
  if (decoded.bytes.length > 5 * 1024 * 1024) {
    return res.status(413).json({ error: `Image too large: ${decoded.bytes.length} bytes (max 5 MB)` })
  }

  const ext = EXT_BY_TYPE[decoded.contentType] || 'bin'
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const pathname = `assets/${folder}/${name}`

  console.info(`[assets] decoded: contentType=${decoded.contentType}, bytes=${decoded.bytes.length}, pathname=${pathname}`)

  try {
    await put(pathname, decoded.bytes, {
      access: 'private',
      addRandomSuffix: false,
      contentType: decoded.contentType,
      allowOverwrite: true,
    })
    const url = publicProxyUrl(req, pathname)
    console.info(`[assets] uploaded → ${url}`)
    return res.status(200).json({ url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown blob error'
    console.error('[assets] put() failed:', msg, e)
    return res.status(500).json({ error: `Blob put failed: ${msg}` })
  }
}
