import { head, put } from '@vercel/blob'

// Guest list stored as a public JSON blob at `guests/<slug>.json`.
//
// CRITICAL — bypassing the Vercel Blob CDN cache:
// The blob is `access: 'public'` (no migration needed for existing lists).
// `useCache: false` is IGNORED for public blobs, so we can't use the
// shortcut `get()`. Instead we:
//   1. `head(pathname)` to discover the current blob URL.
//   2. `fetch(url + '?_=<timestamp>', { cache: 'no-store' })` to defeat
//      both the browser cache and the edge cache.
// Without this, two devices that both POST a confirmation would each see
// the cached snapshot they originally fetched and the lists would
// diverge until the TTL expired.

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
  let meta
  try {
    meta = await head(pathname)
  } catch (e) {
    // head() throws BlobNotFoundError if the file doesn't exist yet — that's
    // a valid empty list, not an error.
    const name = (e as { name?: string } | undefined)?.name
    if (name === 'BlobNotFoundError') return []
    console.error('[guestlists] head() failed for', pathname, e)
    throw e
  }
  // Append a cache-bust query so the edge CDN can't serve a stale snapshot
  // of the rewritten file.
  const cacheBustUrl = `${meta.url}${meta.url.includes('?') ? '&' : '?'}_=${Date.now()}`
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

async function writeList(pathname: string, list: GuestEntry[]): Promise<void> {
  await put(pathname, JSON.stringify(list), {
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
      try {
        await head(pathname)
        // File exists, do nothing.
        return res.status(200).json({ ok: true, existed: true })
      } catch (e) {
        const name = (e as { name?: string } | undefined)?.name
        if (name !== 'BlobNotFoundError') throw e
      }
      await writeList(pathname, [])
      return res.status(200).json({ ok: true, existed: false })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    console.error('[guestlists] handler error:', msg, e)
    return res.status(500).json({ error: msg })
  }
}
