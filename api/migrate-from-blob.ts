import { list } from '@vercel/blob'
import { kv } from '@vercel/kv'

// One-shot migration endpoint: copies every invitation stored as a Vercel
// Blob at `inv/<slug>.json` into Vercel KV at key `inv:<slug>`.
//
// Usage:
//   GET /api/migrate-from-blob?admin=<ADMIN_TOKEN>
//
// Safe to run multiple times — existing KV entries are overwritten with the
// latest blob content. Does not delete the blobs.

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

const ADMIN_TOKEN = 'jb-c7f9a3e1b8d24f5e9a1c6b3d8e2f4a7b'
const KEY_PREFIX = 'inv:'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  const tokenRaw = req.query.admin
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw
  if (token !== ADMIN_TOKEN) return res.status(403).json({ error: 'Forbidden' })

  try {
    const { blobs } = await list({ prefix: 'inv/' })
    const jsonBlobs = blobs.filter((b) => b.pathname.endsWith('.json'))

    const results = await Promise.allSettled(
      jsonBlobs.map(async (b) => {
        const slug = b.pathname.replace(/^inv\//, '').replace(/\.json$/, '')
        if (!slug) return { slug: b.pathname, ok: false, reason: 'empty slug' }
        const r = await fetch(b.url, { cache: 'no-store' })
        if (!r.ok) return { slug, ok: false, reason: `fetch ${r.status}` }
        const json = await r.json()
        await kv.set(KEY_PREFIX + slug, json)
        return { slug, ok: true }
      }),
    )

    const migrated = results
      .filter((r): r is PromiseFulfilledResult<{ slug: string; ok: boolean; reason?: string }> => r.status === 'fulfilled')
      .map((r) => r.value)
    const failedPromises = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => ({ ok: false, reason: String(r.reason) }))

    return res.status(200).json({
      total: jsonBlobs.length,
      migrated: migrated.filter((m) => m.ok).length,
      failed: [...migrated.filter((m) => !m.ok), ...failedPromises],
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(500).json({ error: msg })
  }
}
