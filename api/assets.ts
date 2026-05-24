import { put } from '@vercel/blob'

// Uploads a base64-encoded image (data: URI) to public blob storage and
// returns its public URL. Lets the editor strip large `data:` payloads out
// of the invitation JSON before publishing.
//
// Body: { dataUri: "data:image/...;base64,...", folder: "inv-<slug>" }
//
// Vercel Functions accept JSON bodies up to ~4.5 MB by default. The
// editor's file pickers cap at 3 MB raw → ~4 MB base64-in-JSON → fits.

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

/**
 * Parse a data: URI without regex (regex on multi-MB strings can be slow
 * or hit unexpected limits). Returns { contentType, bytes } or null if the
 * URI is malformed.
 */
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  console.info('[assets] received POST')

  // Step 1: read and parse body
  let payload: { dataUri?: string; folder?: string } = {}
  try {
    if (typeof req.body === 'string') {
      payload = JSON.parse(req.body)
    } else if (req.body && typeof req.body === 'object') {
      payload = req.body as { dataUri?: string; folder?: string }
    } else {
      console.warn('[assets] missing JSON body, got:', typeof req.body)
      return res.status(400).json({ error: 'Missing JSON body' })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'parse error'
    console.error('[assets] JSON parse failed:', msg)
    return res.status(400).json({ error: `Invalid JSON body: ${msg}` })
  }

  const dataUri = payload.dataUri
  const folder = sanitizeSegment(payload.folder || '')
  if (!dataUri || typeof dataUri !== 'string') {
    console.warn('[assets] missing dataUri')
    return res.status(400).json({ error: 'Missing dataUri' })
  }

  console.info(`[assets] payload received: folder=${folder}, dataUri.length=${dataUri.length}`)

  // Step 2: decode
  const decoded = parseDataUri(dataUri)
  if (!decoded) {
    console.warn('[assets] could not parse data URI')
    return res.status(400).json({ error: 'Could not parse data URI' })
  }
  if (decoded.bytes.length === 0) {
    return res.status(400).json({ error: 'Empty image' })
  }
  if (decoded.bytes.length > 5 * 1024 * 1024) {
    return res.status(413).json({ error: `Image too large: ${decoded.bytes.length} bytes (max 5 MB)` })
  }

  const ext = EXT_BY_TYPE[decoded.contentType] || 'bin'
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const pathname = `assets/${folder}/${name}`

  console.info(`[assets] decoded: contentType=${decoded.contentType}, bytes=${decoded.bytes.length}, pathname=${pathname}`)

  // Step 3: upload to blob
  try {
    const { url } = await put(pathname, decoded.bytes, {
      access: 'public',
      addRandomSuffix: false,
      contentType: decoded.contentType,
      allowOverwrite: true,
    })
    console.info(`[assets] uploaded → ${url}`)
    return res.status(200).json({ url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown blob error'
    console.error('[assets] put() failed:', msg, e)
    return res.status(500).json({ error: `Blob put failed: ${msg}` })
  }
}
