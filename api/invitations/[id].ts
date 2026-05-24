import { get, put, del } from '@vercel/blob'

// Stores each invitation as a private JSON blob at `inv/<slug>.json`.
// `BLOB_READ_WRITE_TOKEN` is injected automatically by Vercel when a Blob
// store is connected to the project. Vercel Functions accept JSON bodies
// up to ~4.5 MB by default, which is enough for our 4 MB invitation cap.

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
      // useCache:false bypasses the Vercel Blob CDN cache. Without this,
      // after `put({ allowOverwrite:true })` updates an invitation, devices
      // that previously cached the older version (mobile vs desktop, two
      // different edge nodes) keep seeing the stale data — that's how the
      // user's mobile and desktop showed different invitations and how the
      // published view kept showing the old fonts / missing bg images
      // immediately after a re-publish.
      const result = await get(pathname, { access: 'private', useCache: false })
      if (!result || result.statusCode !== 200) return res.status(404).json({ error: 'Not found' })
      const text = await new Response(result.stream).text()
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.status(200).send(text)
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      // 4 MB is the practical max body Vercel will accept for serverless
      // functions. The client extracts any base64 images via /api/assets
      // before publishing so the invitation JSON should stay well under this.
      if (!payload || payload.length > 4 * 1024 * 1024) {
        return res.status(413).json({ error: 'Payload too large. Las imágenes deben subirse como URL pública.' })
      }
      await put(pathname, payload, {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'application/json',
        allowOverwrite: true,
      })
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      try {
        await del(pathname)
      } catch (e) {
        const name = (e as { name?: string } | undefined)?.name
        if (name !== 'BlobNotFoundError') throw e
      }
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    console.error('[invitations] handler error:', msg, e)
    return res.status(500).json({ error: msg })
  }
}
