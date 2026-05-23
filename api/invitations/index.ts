import { list, del } from '@vercel/blob'

// Lists / deletes invitations stored as public JSON blobs under `inv/`.
//
// Routes:
//   GET    /api/invitations/index        → array of full Invitation objects
//   DELETE /api/invitations/index?id=<slug> → deletes one invitation

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: 'inv/' })
      const results = await Promise.allSettled(
        blobs
          .filter((b) => b.pathname.endsWith('.json'))
          .map(async (b) => {
            const r = await fetch(b.url, { cache: 'no-store' })
            if (!r.ok) return null
            return r.json()
          }),
      )
      const invitations = results
        .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled' && r.value !== null)
        .map((r) => r.value)
      return res.status(200).json(invitations)
    }

    if (req.method === 'DELETE') {
      const idRaw = req.query.id
      const id = Array.isArray(idRaw) ? idRaw[0] : idRaw
      if (!id || !SLUG_RE.test(id)) return res.status(400).json({ error: 'Invalid id' })
      const pathname = `inv/${id}.json`
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
