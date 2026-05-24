import { put } from '@vercel/blob'

// Uploads a base64-encoded image (data: URI) to public blob storage and
// returns its public URL. Lets the editor strip large `data:` payloads out
// of the invitation JSON before publishing so the body stays under the
// platform's request-size limit.
//
// Body shape: { dataUri: "data:image/...;base64,...", folder: "inv-<slug>" }
//
// We don't disable the body parser — Vercel Functions auto-parses JSON
// bodies up to ~4.5 MB, which is enough for our 2.5 MB raw image cap
// (raw 2.5 MB → base64 ~3.4 MB → JSON-wrapped ~3.5 MB < 4.5 MB).

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
  return s.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'misc'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Body may come in already-parsed (Vercel default) or as a string —
    // handle both shapes.
    let payload: { dataUri?: string; folder?: string } = {}
    if (typeof req.body === 'string') {
      try {
        payload = JSON.parse(req.body)
      } catch {
        return res.status(400).json({ error: 'Body is not valid JSON' })
      }
    } else if (req.body && typeof req.body === 'object') {
      payload = req.body as { dataUri?: string; folder?: string }
    } else {
      return res.status(400).json({ error: 'Missing JSON body' })
    }

    const dataUri = payload.dataUri
    const folder = sanitizeSegment(payload.folder || '')
    if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:')) {
      return res.status(400).json({ error: 'Missing or invalid dataUri' })
    }

    const match = /^data:([^;,]+)(;base64)?,(.*)$/.exec(dataUri)
    if (!match) return res.status(400).json({ error: 'Could not parse data URI' })
    const contentType = (match[1] || 'application/octet-stream').toLowerCase()
    const isBase64 = !!match[2]
    const rawBody = match[3]
    const ext = EXT_BY_TYPE[contentType] || 'bin'

    const buf = isBase64
      ? Buffer.from(rawBody, 'base64')
      : Buffer.from(decodeURIComponent(rawBody), 'utf8')

    if (buf.length === 0) {
      return res.status(400).json({ error: 'Empty image' })
    }

    const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const pathname = `assets/${folder}/${name}`

    const { url } = await put(pathname, buf, {
      access: 'public',
      addRandomSuffix: false,
      contentType,
      allowOverwrite: true,
    })

    return res.status(200).json({ url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    console.error('[assets] handler error:', msg, e)
    return res.status(500).json({ error: msg })
  }
}
