import { list, get } from '@vercel/blob'

// Looks up the RSVP block whose `guestListSlug` matches `:slug` and returns the
// custom field labels the editor configured (currently just the message field).
// Used by the public confirmados page so it can show the same title the host
// chose, instead of the generic "Mensaje".

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')
}

interface InvitationLike {
  blocks?: Array<{
    type?: string
    data?: {
      guestListSlug?: string
      messageLabel?: string
      messagePlaceholder?: string
    }
  }>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const idRaw = req.query.slug
  const slug = Array.isArray(idRaw) ? idRaw[0] : idRaw
  if (!slug || !SLUG_RE.test(slug)) return res.status(400).json({ error: 'Invalid id' })

  try {
    const { blobs } = await list({ prefix: 'inv/' })
    for (const b of blobs) {
      if (!b.pathname.endsWith('.json')) continue
      try {
        const r = await get(b.pathname, { access: 'private', useCache: false })
        if (!r || r.statusCode !== 200) continue
        const parsed = JSON.parse(await new Response(r.stream).text()) as InvitationLike
        const blocks = Array.isArray(parsed?.blocks) ? parsed.blocks : []
        for (const block of blocks) {
          if (block?.type === 'rsvp-info' && block?.data?.guestListSlug === slug) {
            return res.status(200).json({
              messageLabel: typeof block.data.messageLabel === 'string' ? block.data.messageLabel : '',
              messagePlaceholder: typeof block.data.messagePlaceholder === 'string' ? block.data.messagePlaceholder : '',
            })
          }
        }
      } catch {
        // skip unreadable
      }
    }
    return res.status(200).json({ messageLabel: '', messagePlaceholder: '' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return res.status(500).json({ error: msg })
  }
}
