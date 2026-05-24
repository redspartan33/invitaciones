import { get, put } from '@vercel/blob'

// Guest list stored as a private JSON blob at `guests/<slug>.json`.
//
// The Vercel Blob store is configured as private-only, so EVERY blob we
// write must use `access: 'private'`. Reads use `useCache: false` to
// bypass the CDN cache — important so two devices that both POST see the
// latest list instead of their own cached snapshot.
//
// Browsers never touch the blob URL directly; the public-facing
// `/api/guestlists/<slug>` endpoint proxies the read using the
// `BLOB_READ_WRITE_TOKEN`.

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

async function readListSafe(pathname: string): Promise<GuestEntry[]> {
  // Wrap get() so any SDK error (missing blob, transient SDK problem) returns
  // an empty list rather than 500'ing the whole handler. We do NOT distinguish
  // "doesn't exist" from "couldn't read" — both should yield an empty list so
  // POSTs can still write and GETs report 0 confirmations rather than 500.
  try {
    const result = await get(pathname, { access: 'private', useCache: false })
    if (!result || result.statusCode !== 200) return []
    const text = await new Response(result.stream).text()
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? (parsed as GuestEntry[]) : []
  } catch (e) {
    // Log but don't propagate — the user should see "no confirmations yet"
    // not "server error".
    console.warn('[guestlists] readListSafe could not read', pathname, e)
    return []
  }
}

async function writeList(pathname: string, items: GuestEntry[]): Promise<void> {
  // Blob store is configured as private-only — every write must use
  // access:'private'. Browsers never touch this URL directly; reads always
  // go through this API which authenticates via BLOB_READ_WRITE_TOKEN.
  await put(pathname, JSON.stringify(items), {
    access: 'private',
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
      const entries = await readListSafe(pathname)
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

      const current = await readListSafe(pathname)
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
      // Initialize empty file only if missing — don't clobber existing
      // confirmations when the editor re-saves the block config.
      const existing = await readListSafe(pathname)
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
