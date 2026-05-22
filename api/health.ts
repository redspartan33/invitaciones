interface VercelRequest { method?: string }
interface VercelResponse {
  status: (code: number) => VercelResponse
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => VercelResponse
  end: () => VercelResponse
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ ok: true, service: 'invitation-builder' })
}
