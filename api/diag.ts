import { put, list, del } from '@vercel/blob'

// Diagnostic endpoint: reports whether Vercel Blob is reachable end-to-end
// by writing a probe blob, reading it back, and deleting it. Surfaces the
// real reason a publish would fail.
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

  const env = { BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN }

  const probePath = `inv/__diag_probe__.json`
  const probeValue = { ts: Date.now(), nonce: Math.random().toString(36).slice(2) }

  let writeOk = false
  let readOk = false
  let error: string | null = null

  try {
    const { url } = await put(probePath, JSON.stringify(probeValue), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
      allowOverwrite: true,
    })
    writeOk = true

    const r = await fetch(url, { cache: 'no-store' })
    if (r.ok) {
      const back = await r.json()
      readOk = back?.nonce === probeValue.nonce
    }

    const { blobs } = await list({ prefix: probePath })
    for (const b of blobs) {
      if (b.pathname === probePath) await del(b.url)
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }

  return res.status(200).json({
    env,
    blob: { writeOk, readOk, error },
    summary:
      writeOk && readOk
        ? 'Blob OK — publish should work end-to-end.'
        : error ?? 'Blob reachable but write/read returned unexpected value.',
  })
}
