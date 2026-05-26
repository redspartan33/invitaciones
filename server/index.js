import express from 'express'
import cors from 'cors'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const UPLOADS_DIR = path.join(__dirname, 'uploads')
const INV_DIR = path.join(DATA_DIR, 'inv')
const GUESTS_DIR = path.join(DATA_DIR, 'guests')

await fs.mkdir(INV_DIR, { recursive: true })
await fs.mkdir(GUESTS_DIR, { recursive: true })
await fs.mkdir(UPLOADS_DIR, { recursive: true })

const app = express()
const PORT = process.env.PORT || 5050

app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '6mb' }))
app.disable('x-powered-by')

const SLUG_RE = /^[A-Za-z0-9_-]{1,64}$/
const SEGMENT_RE = /^[A-Za-z0-9._-]+$/

const EXT_BY_TYPE = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}

const MIME_BY_EXT = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
}

const noStore = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
}

function parseDataUri(dataUri) {
  if (typeof dataUri !== 'string' || !dataUri.startsWith('data:')) return null
  const commaIdx = dataUri.indexOf(',')
  if (commaIdx < 0) return null
  const meta = dataUri.slice(5, commaIdx)
  const isBase64 = /;base64$/i.test(meta)
  const contentType = (isBase64 ? meta.slice(0, -7) : meta).split(';')[0] || 'application/octet-stream'
  const raw = dataUri.slice(commaIdx + 1)
  try {
    const bytes = isBase64 ? Buffer.from(raw, 'base64') : Buffer.from(decodeURIComponent(raw), 'utf8')
    return { contentType: contentType.toLowerCase(), bytes }
  } catch {
    return null
  }
}

function sanitizeSegment(s) {
  const cleaned = String(s || '').replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 64)
  return cleaned || 'misc'
}

// ── health & diag ───────────────────────────────────────────────────────────
app.get('/api/health', noStore, (_req, res) => {
  res.json({ ok: true, service: 'invitation-builder' })
})

app.get('/api/diag', noStore, async (_req, res) => {
  const probePath = path.join(INV_DIR, '__diag_probe__.json')
  const probeValue = { ts: Date.now(), nonce: Math.random().toString(36).slice(2) }
  let writeOk = false
  let readOk = false
  let error = null
  try {
    await fs.writeFile(probePath, JSON.stringify(probeValue), 'utf8')
    writeOk = true
    const text = await fs.readFile(probePath, 'utf8')
    readOk = JSON.parse(text).nonce === probeValue.nonce
    await fs.unlink(probePath)
  } catch (e) {
    error = e instanceof Error ? e.message : 'unknown'
  }
  res.json({
    ok: writeOk && readOk,
    storage: { type: 'filesystem', dir: DATA_DIR },
    writeOk,
    readOk,
    error,
  })
})

// ── invitations ─────────────────────────────────────────────────────────────
app.get('/api/invitations/index', noStore, async (_req, res) => {
  try {
    const files = await fs.readdir(INV_DIR)
    const invitations = []
    for (const file of files) {
      if (!file.endsWith('.json') || file.startsWith('__')) continue
      try {
        const text = await fs.readFile(path.join(INV_DIR, file), 'utf8')
        invitations.push(JSON.parse(text))
      } catch {
        // skip unreadable / corrupt entries
      }
    }
    res.json(invitations)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'unknown' })
  }
})

app.delete('/api/invitations/index', noStore, async (req, res) => {
  const id = String(req.query.id || '')
  if (!SLUG_RE.test(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    await fs.unlink(path.join(INV_DIR, `${id}.json`))
  } catch (e) {
    if (e.code !== 'ENOENT') return res.status(500).json({ error: e.message })
  }
  res.json({ ok: true })
})

app.get('/api/invitations/:id', noStore, async (req, res) => {
  const { id } = req.params
  if (!SLUG_RE.test(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    const text = await fs.readFile(path.join(INV_DIR, `${id}.json`), 'utf8')
    res.type('application/json; charset=utf-8').send(text)
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'Not found' })
    res.status(500).json({ error: e.message })
  }
})

const saveInvitation = async (req, res) => {
  const { id } = req.params
  if (!SLUG_RE.test(id)) return res.status(400).json({ error: 'Invalid id' })
  const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  if (!payload || payload.length > 4 * 1024 * 1024) {
    return res.status(413).json({ error: 'Payload too large. Las imágenes deben subirse como URL pública.' })
  }
  try {
    await fs.writeFile(path.join(INV_DIR, `${id}.json`), payload, 'utf8')
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
app.put('/api/invitations/:id', noStore, saveInvitation)
app.post('/api/invitations/:id', noStore, saveInvitation)

app.delete('/api/invitations/:id', noStore, async (req, res) => {
  const { id } = req.params
  if (!SLUG_RE.test(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    await fs.unlink(path.join(INV_DIR, `${id}.json`))
  } catch (e) {
    if (e.code !== 'ENOENT') return res.status(500).json({ error: e.message })
  }
  res.json({ ok: true })
})

// ── assets (image upload) ───────────────────────────────────────────────────
app.post('/api/assets', noStore, async (req, res) => {
  const dataUri = req.body && req.body.dataUri
  const folder = sanitizeSegment(req.body && req.body.folder)
  if (!dataUri || typeof dataUri !== 'string') {
    return res.status(400).json({ error: 'Missing dataUri' })
  }
  const decoded = parseDataUri(dataUri)
  if (!decoded) return res.status(400).json({ error: 'Could not parse data URI' })
  if (decoded.bytes.length === 0) return res.status(400).json({ error: 'Empty image' })
  if (decoded.bytes.length > 5 * 1024 * 1024) {
    return res.status(413).json({ error: `Image too large: ${decoded.bytes.length} bytes (max 5 MB)` })
  }
  const ext = EXT_BY_TYPE[decoded.contentType] || 'bin'
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const folderDir = path.join(UPLOADS_DIR, folder)
  try {
    await fs.mkdir(folderDir, { recursive: true })
    await fs.writeFile(path.join(folderDir, name), decoded.bytes)
    res.json({ url: `/api/asset/${folder}/${name}` })
  } catch (e) {
    res.status(500).json({ error: `Save failed: ${e.message}` })
  }
})

app.get('/api/asset/*', async (req, res) => {
  const tail = req.params[0] || ''
  const segments = tail.split('/').filter(Boolean)
  if (segments.length === 0) return res.status(400).json({ error: 'Missing path' })
  for (const s of segments) {
    if (!SEGMENT_RE.test(s) || s.startsWith('.')) {
      return res.status(400).json({ error: 'Invalid path segment' })
    }
  }
  const filePath = path.join(UPLOADS_DIR, ...segments)
  const last = segments[segments.length - 1]
  const ext = last.includes('.') ? last.split('.').pop().toLowerCase() : ''
  const mime = MIME_BY_EXT[ext] || 'application/octet-stream'
  try {
    const buf = await fs.readFile(filePath)
    res.setHeader('Content-Type', mime)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(buf)
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'Not found' })
    res.status(500).json({ error: e.message })
  }
})

// ── guestlists ──────────────────────────────────────────────────────────────
async function readGuestsSafe(slug) {
  try {
    const text = await fs.readFile(path.join(GUESTS_DIR, `${slug}.json`), 'utf8')
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeGuests(slug, entries) {
  await fs.writeFile(path.join(GUESTS_DIR, `${slug}.json`), JSON.stringify(entries), 'utf8')
}

app.get('/api/guestlists/:slug', noStore, async (req, res) => {
  const { slug } = req.params
  if (!SLUG_RE.test(slug)) return res.status(400).json({ error: 'Invalid id' })
  const entries = await readGuestsSafe(slug)
  res.type('application/json; charset=utf-8').send(JSON.stringify(entries))
})

app.post('/api/guestlists/:slug', noStore, async (req, res) => {
  const { slug } = req.params
  if (!SLUG_RE.test(slug)) return res.status(400).json({ error: 'Invalid id' })
  const name = String((req.body && req.body.name) || '').trim()
  if (!name) return res.status(400).json({ error: 'Missing name' })
  const entry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    message: String((req.body && req.body.message) || ''),
    createdAt: new Date().toISOString(),
  }
  const current = await readGuestsSafe(slug)
  current.push(entry)
  try {
    await writeGuests(slug, current)
    res.json({ ok: true, entry })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/guestlists/:slug', noStore, async (req, res) => {
  const { slug } = req.params
  if (!SLUG_RE.test(slug)) return res.status(400).json({ error: 'Invalid id' })
  const existing = await readGuestsSafe(slug)
  if (existing.length === 0) {
    try {
      await writeGuests(slug, [])
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }
  res.json({ ok: true })
})

// ── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path })
})

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
  console.log(`[server] data dir:    ${DATA_DIR}`)
  console.log(`[server] uploads dir: ${UPLOADS_DIR}`)
})
