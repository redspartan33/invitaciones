import { put } from '@vercel/blob'

// Uploads an image to public blob storage and returns its public URL.
//
// Body format: RAW BINARY (the image bytes themselves, not a JSON wrapper
// around base64). The Content-Type header carries the MIME, and the
// filename + folder come in the query string. This avoids:
//   • Vercel's default JSON body parser size cap (~1 MB)
//   • The ~33% inflation from base64 encoding
//   • All JSON parsing on the server side
//
// The client (publishAssets.ts) decodes any `data:` URIs in the invitation
// and POSTs the raw bytes here, then drops the returned URL into the JSON.

// Disable the built-in body parser entirely; we want raw bytes.
export const config = {
  api: {
    bodyParser: false,
  },
}

interface VercelRequest {
  method?: string
  query: Record<string, string | string[] | undefined>
  body: unknown
  headers: Record<string, string | string[] | undefined>
  on: (event: string, listener: (...args: unknown[]) => void) => void
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
  return s.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'misc'
}

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: unknown) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer))
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', (err: unknown) => reject(err as Error))
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const folderRaw = req.query.folder
    const folder = sanitizeSegment(Array.isArray(folderRaw) ? folderRaw[0] || '' : folderRaw || '')
    const contentTypeRaw = req.headers['content-type']
    const contentType = (Array.isArray(contentTypeRaw) ? contentTypeRaw[0] : contentTypeRaw) || 'application/octet-stream'
    const cleanType = contentType.split(';')[0].trim().toLowerCase()
    const ext = EXT_BY_TYPE[cleanType] || 'bin'

    const body = await readRawBody(req)
    if (body.length === 0) {
      return res.status(400).json({ error: 'Empty body' })
    }
    if (body.length > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large (max 5 MB).' })
    }

    const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const pathname = `assets/${folder}/${name}`

    const { url } = await put(pathname, body, {
      access: 'public',
      addRandomSuffix: false,
      contentType: cleanType,
      allowOverwrite: true,
    })

    return res.status(200).json({ url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    console.error('[assets] handler error:', msg, e)
    return res.status(500).json({ error: msg })
  }
}
