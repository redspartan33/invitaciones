import { get, put } from '@vercel/blob'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const idRaw = req.query.slug || req.query.id
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw
  if (!id) return res.status(400).json({ error: 'Invalid id' })
  const pathname = `guests/${id}.json`

  try {
    if (req.method === 'GET') {
      const result = await get(pathname, { access: 'public' })
      if (!result || result.statusCode !== 200) return res.status(404).json({ error: 'Not found' })
      const text = await new Response(result.stream).text()
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.status(200).send(text)
    }

    if (req.method === 'POST') {
      // body: { name, message }
      const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
      let parsed: any
      try { parsed = JSON.parse(payload) } catch { parsed = {} }
      const name = (parsed.name || '').trim()
      if (!name) return res.status(400).json({ error: 'Missing name' })

      // Load existing list (if any)
      let list: any[] = []
      try {
        const result = await get(pathname, { access: 'public' })
        if (result && result.statusCode === 200) {
          const text = await new Response(result.stream).text()
          list = JSON.parse(text)
          if (!Array.isArray(list)) list = []
        }
      } catch (e) {
        // ignore
      }

      const entry = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`, name, message: parsed.message || '', createdAt: new Date().toISOString() }
      list.push(entry)

      await put(pathname, JSON.stringify(list), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
        allowOverwrite: true,
      })

      return res.status(200).json({ ok: true, entry })
    }

    if (req.method === 'PUT') {
      // Initialize an empty guest list file (create or overwrite).
      const empty: any[] = []
      await put(pathname, JSON.stringify(empty), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
        allowOverwrite: true,
      })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(500).json({ error: msg })
  }
}
