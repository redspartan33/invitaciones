import { list, get, del } from '@vercel/blob'

// Lists / deletes invitations stored as private JSON blobs under `inv/`.
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
            const r = await get(b.pathname, { access: 'private' })
            if (!r || r.statusCode !== 200) return null
            return JSON.parse(await new Response(r.stream).text())
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
      await del(`inv/${id}.json`)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(500).json({ error: msg })
  }
}
