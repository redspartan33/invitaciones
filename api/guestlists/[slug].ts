import { list, put } from '@vercel/blob'

// Guest list stored as a public JSON blob at `guests/<slug>.json`.
//
// Reads use `list({ prefix })` + `fetch(blob.url + '?_=<ts>', { cache:
// 'no-store' })` to bypass the Vercel Blob CDN cache. We avoid `head()`
// and `get()` here because their error semantics across @vercel/blob
// versions are inconsistent (different error class names depending on
// SDK), and the 500s in production came from those errors not matching
// the `BlobNotFoundError` name we were checking for. `list()` always
// resolves — empty array means the file doesn't exist, no exception
// hierarchy to navigate.

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

interface GuestEntry {
  id: string
  name: string
  message?: string
  createdAt: string
}

async function readList(pathname: string): Promise<GuestEntry[]> {
  const { blobs } = await list({ prefix: pathname, limit: 1 })
  // `prefix` is a *prefix* match — narrow to the exact path.
  const blob = blobs.find((b) => b.pathname === pathname)
  if (!blob) return []
  const cacheBustUrl = `${blob.url}${blob.url.includes('?') ? '&' : '?'}_=${Date.now()}`
  const res = await fetch(cacheBustUrl, { cache: 'no-store' })
  if (!res.ok) {
    console.error('[guestlists] fetch of blob URL failed', res.status, cacheBustUrl)
    return []
  }
  let data: unknown
  try {
    data = await res.json()
  } catch (e) {
    console.error('[guestlists] blob JSON parse failed', e)
    return []
  }
  return Array.isArray(data) ? (data as GuestEntry[]) : []
}

async function writeList(pathname: string, items: GuestEntry[]): Promise<void> {
  await put(pathname, JSON.stringify(items), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    allowOverwrite: true,
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const idRaw = req.query.slug || req.query.id
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw
  if (!id || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid id' })
  }
  const pathname = `guests/${id}.json`

  try {
    if (req.method === 'GET') {
      const entries = await readList(pathname)
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.status(200).send(JSON.stringify(entries))
    }

    if (req.method === 'POST') {
      const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
      let parsed: { name?: string; message?: string }
      try {
        parsed = JSON.parse(payload)
      } catch {
        parsed = {}
      }
      const name = (parsed.name || '').trim()
      if (!name) return res.status(400).json({ error: 'Missing name' })

      const current = await readList(pathname)
      const entry: GuestEntry = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        message: parsed.message || '',
        createdAt: new Date().toISOString(),
      }
      current.push(entry)
      await writeList(pathname, current)
      return res.status(200).json({ ok: true, entry })
    }

    if (req.method === 'PUT') {
      // Only create the file if it doesn't already exist — never clobber
      // existing confirmations because the editor saved the block again.
      const existing = await readList(pathname)
      if (existing.length === 0) await writeList(pathname, [])
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    console.error('[guestlists] handler error:', msg, e)
    return res.status(500).json({ error: msg })
  }
}
