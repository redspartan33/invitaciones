import { put, list } from '@vercel/blob'

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const idRaw = req.query.slug || req.query.id
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw
  if (!id) return res.status(400).json({ error: 'Invalid id' })
  const pathname = `guests/${id}.json`

  // Read by `list()` + fetch from the latest `url` with no-store. This avoids
  // the edge/CDN cache that `get()` can hit after `put(... allowOverwrite)`,
  // which would return stale lists to one device while the other writes new
  // entries. The blob is unique by `pathname` so list() always returns 0..1.
  async function readList(): Promise<any[]> {
    try {
      const { blobs } = await list({ prefix: pathname, limit: 1 })
      const blob = blobs.find((b) => b.pathname === pathname)
      if (!blob) return []
      const r = await fetch(blob.url, { cache: 'no-store' })
      if (!r.ok) return []
      const data = await r.json()
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  try {
    if (req.method === 'GET') {
      const entries = await readList()
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.status(200).send(JSON.stringify(entries))
    }

    if (req.method === 'POST') {
      // body: { name, message }
      const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
      let parsed: any
      try { parsed = JSON.parse(payload) } catch { parsed = {} }
      const name = (parsed.name || '').trim()
      if (!name) return res.status(400).json({ error: 'Missing name' })

      const current = await readList()
      const entry = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        message: parsed.message || '',
        createdAt: new Date().toISOString(),
      }
      current.push(entry)

      await put(pathname, JSON.stringify(current), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
        allowOverwrite: true,
      })

      return res.status(200).json({ ok: true, entry })
    }

    if (req.method === 'PUT') {
      // Initialize an empty guest list file (create or overwrite).
      const empty: any[] = []
      await put(pathname, JSON.stringify(empty), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
        allowOverwrite: true,
      })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(500).json({ error: msg })
  }
}
