import { put, get, del } from '@vercel/blob'

// Diagnostic endpoint: writes a probe blob, reads it back, deletes it, and
// reports the result. Use this when publish fails to know exactly what's
// wrong with the Blob connection.
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
    await put(probePath, JSON.stringify(probeValue), {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json',
      allowOverwrite: true,
    })
    writeOk = true

    const result = await get(probePath, { access: 'private' })
    if (result && result.statusCode === 200) {
      const back = JSON.parse(await new Response(result.stream).text())
      readOk = back?.nonce === probeValue.nonce
    }

    await del(probePath)
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
