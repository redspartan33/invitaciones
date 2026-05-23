import { put, list, del } from '@vercel/blob'

// Stores each invitation as a public JSON blob at `inv/<slug>.json`.
// `BLOB_READ_WRITE_TOKEN` is injected automatically by Vercel when a Blob
// store is connected to the project.

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

const SLUG_RE = /^[A-Za-z0-9_-]{1,64}$/

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const idRaw = req.query.id
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw
  if (!id || !SLUG_RE.test(id)) return res.status(400).json({ error: 'Invalid id' })
  const pathname = `inv/${id}.json`

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: pathname })
      const match = blobs.find((b) => b.pathname === pathname)
      if (!match) return res.status(404).json({ error: 'Not found' })
      const r = await fetch(match.url, { cache: 'no-store' })
      const text = await r.text()
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.status(200).send(text)
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      if (!payload || payload.length > 2 * 1024 * 1024) {
        return res.status(413).json({ error: 'Payload too large' })
      }
      await put(pathname, payload, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
        allowOverwrite: true,
      })
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const { blobs } = await list({ prefix: pathname })
      for (const b of blobs) {
        if (b.pathname === pathname) await del(b.url)
      }
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(500).json({ error: msg })
  }
}
