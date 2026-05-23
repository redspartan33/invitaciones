import { kv } from '@vercel/kv'

// Diagnostic endpoint: reports whether KV is reachable end-to-end by writing
// a probe key, reading it back, and deleting it. Surfaces the real reason a
// publish would fail (missing env vars, wrong region, expired token, etc.).
//
// Usage: GET /api/diag

interface VercelRequest {
  method?: string
  query: Record<string, string | string[] | undefined>
}
interface VercelResponse {
  status: (code: number) => VercelResponse
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => VercelResponse
  end: (body?: string) => VercelResponse
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  const env = {
    KV_URL: !!process.env.KV_URL,
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
  }

  const probeKey = '__diag_probe__'
  const probeValue = { ts: Date.now(), nonce: Math.random().toString(36).slice(2) }

  let writeOk = false
  let readOk = false
  let readValue: unknown = null
  let error: string | null = null

  try {
    await kv.set(probeKey, probeValue)
    writeOk = true
    readValue = await kv.get(probeKey)
    readOk = !!readValue && typeof readValue === 'object'
    await kv.del(probeKey)
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }

  return res.status(200).json({
    env,
    kv: { writeOk, readOk, readValue, error },
    summary:
      writeOk && readOk
        ? 'KV OK — publish should work end-to-end.'
        : error ?? 'KV reachable but write/read returned unexpected value.',
  })
}
