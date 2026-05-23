import { kv } from '@vercel/kv'

// Bulk import endpoint: accepts an array of Invitation objects and writes
// each one to KV at `inv:<slug>`. Used to seed KV from the local browser's
// localStorage when migrating to the new backend.
//
// Usage:
//   POST /api/import-bulk?admin=<ADMIN_TOKEN>
//   body: { invitations: Array<Invitation & { _key?: string }> }
//
// The key is taken from `_key` if present, else `publicSlug` for published
// invitations, else `draft-<id>` for drafts.

interface VercelRequest {
  method?: string
  query: Record<string, string | string[] | undefined>
  body: unknown
}
interface VercelResponse {
  status: (code: number) => VercelResponse
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => VercelResponse
  end: (body?: string) => VercelResponse
}

const ADMIN_TOKEN = 'jb-c7f9a3e1b8d24f5e9a1c6b3d8e2f4a7b'
const SLUG_RE = /^[A-Za-z0-9_-]{1,64}$/
const KEY_PREFIX = 'inv:'

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store')
}

interface InvitationLike {
  id?: string
  publicSlug?: string
  status?: string
  _key?: string
  [k: string]: unknown
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const tokenRaw = req.query.admin
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw
  if (token !== ADMIN_TOKEN) return res.status(403).json({ error: 'Forbidden' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const list: InvitationLike[] = Array.isArray(body?.invitations) ? body.invitations : []
    if (list.length === 0) return res.status(400).json({ error: 'Missing invitations array' })

    const results = await Promise.allSettled(
      list.map(async (inv) => {
        const key =
          inv._key ||
          (inv.status === 'published' && inv.publicSlug ? inv.publicSlug : inv.id ? `draft-${inv.id}` : null)
        if (!key || !SLUG_RE.test(key)) return { ok: false, key, reason: 'invalid key' }
        const { _key, ...payload } = inv
        await kv.set(KEY_PREFIX + key, payload)
        return { ok: true, key }
      }),
    )

    const ok = results.filter(
      (r): r is PromiseFulfilledResult<{ ok: true; key: string }> =>
        r.status === 'fulfilled' && r.value.ok === true,
    )
    const failed = results
      .map((r) =>
        r.status === 'fulfilled'
          ? r.value.ok
            ? null
            : r.value
          : { ok: false, reason: String(r.reason) },
      )
      .filter((x) => x !== null)

    return res.status(200).json({ total: list.length, imported: ok.length, failed })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(500).json({ error: msg })
  }
}
