import { kv } from '@vercel/kv'

// Vercel serverless function: lists / deletes invitations stored in Vercel KV.
// Each invitation lives at key `inv:<slug>` (see api/invitations/[id].ts).
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
const KEY_PREFIX = 'inv:'

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
      // Scan keys under the inv: prefix. For <10k entries this is fine; if it
      // ever grows we'd swap to SCAN cursors or a sorted-set index.
      const keys = await kv.keys(KEY_PREFIX + '*')
      if (keys.length === 0) return res.status(200).json([])
      const values = await kv.mget<unknown[]>(...keys)
      const invitations = values.filter((v) => v !== null && v !== undefined)
      return res.status(200).json(invitations)
    }

    if (req.method === 'DELETE') {
      const idRaw = req.query.id
      const id = Array.isArray(idRaw) ? idRaw[0] : idRaw
      if (!id || !SLUG_RE.test(id)) return res.status(400).json({ error: 'Invalid id' })
      await kv.del(KEY_PREFIX + id)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(500).json({ error: msg })
  }
}
