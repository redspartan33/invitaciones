/**
 * Scrape dish images from UberEats (Hannah & Michael) and La Cocinoteca's
 * public site, re-host them on our own /api/assets blob so they survive
 * upstream CDN changes, and emit a JSON manifest per restaurant mapping
 * item name → final blob URL.
 *
 * Run once (or whenever the source menus change). Output:
 *   /tmp/menu-image-map-hm.json
 *   /tmp/menu-image-map-cocinoteca.json
 *
 * Usage:
 *   node scripts/scrape-menu-images.mjs
 *
 * Env:
 *   ASSET_API_BASE  URL where POST /api/assets accepts data URIs
 *                   (default: https://api.lamartinasma.com)
 *   USER_AGENT      Optional UA override for the source fetches.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const execFileP = promisify(execFile)

const ASSET_API_BASE = process.env.ASSET_API_BASE || 'https://api.lamartinasma.com'
const UA =
  process.env.USER_AGENT ||
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const UBEREATS_URL =
  'https://www.ubereats.com/mx/store/hannah-%26-michael-guanajuato/0W_n73GVQweAYlt8uoXKOQ'
const COCINOTECA_URL = 'https://www.lacocinoteca.club/menu'
const COCINOTECA_CDN = 'https://geslacocinotecafront-dev-optimized.s3.amazonaws.com/public'

const CONTENT_TYPE_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

async function fetchText(url) {
  // Use curl: UberEats blocks vanilla Node fetch on TLS fingerprint, but lets
  // a real curl through. We still pass our UA. maxBuffer bumped for the
  // ~1.3 MB UberEats HTML.
  const { stdout } = await execFileP(
    'curl',
    ['-sSL', '--max-time', '30', '-A', UA, url],
    { maxBuffer: 16 * 1024 * 1024 },
  )
  if (!stdout || stdout.length < 500) throw new Error(`GET ${url} returned ${stdout.length} bytes`)
  return stdout
}

async function fetchImageAsDataUri(url) {
  // curl is used for the same reason as fetchText: both source CDNs are
  // hotlinkable from curl but UberEats blocks Node's TLS profile. We ask
  // curl to dump bytes to stdout (binary-safe via Buffer concat).
  let buf
  try {
    const { stdout } = await execFileP(
      'curl',
      ['-sSL', '--max-time', '30', '-A', UA, url],
      { encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 },
    )
    buf = stdout
  } catch {
    return null
  }
  if (!buf || buf.length === 0) return null
  // No content-type header in this codepath; infer from extension.
  const ext = (url.split('.').pop() || '').toLowerCase().replace(/\?.*$/, '')
  const ct = CONTENT_TYPE_BY_EXT[ext] || 'image/jpeg'
  // Reject obvious non-images (S3 returns XML errors with `.undefined`).
  if (buf.slice(0, 5).toString('utf8') === '<?xml') return null
  return { dataUri: `data:${ct};base64,${buf.toString('base64')}`, bytes: buf.length }
}

async function uploadToAssets(dataUri, folder) {
  const res = await fetch(`${ASSET_API_BASE}/api/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUri, folder }),
  })
  if (!res.ok) throw new Error(`POST /api/assets → ${res.status} ${await res.text().catch(() => '')}`)
  const { url } = await res.json()
  if (!url) throw new Error('Assets endpoint did not return a URL')
  return url
}

// ── H&M (UberEats) ──────────────────────────────────────────────────────────

function parseHannahMichael(html) {
  // The doubly-escaped catalog payload encodes pairs as
  //   "imageUrl":"<url>","title":"<name>"
  // (we already proved the order; titles come AFTER imageUrl).
  const pat =
    /\\u0022imageUrl\\u0022:\\u0022(https?:\/\/tb-static\.uber\.com\/[^"\\]+)\\u0022,\\u0022title\\u0022:\\u0022([^"\\]+)\\u0022/g
  const map = new Map()
  for (const m of html.matchAll(pat)) {
    const url = m[1]
    const title = m[2]
    if (!map.has(title)) map.set(title, url)
  }
  return map
}

// ── La Cocinoteca ───────────────────────────────────────────────────────────

function parseCocinoteca(html) {
  const m = html.match(/__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/)
  if (!m) throw new Error('Cocinoteca: __NEXT_DATA__ not found')
  const data = JSON.parse(m[1]).props.pageProps.data
  const map = new Map()
  for (const d of data.dishes) {
    if (!d.image) continue
    if (d.image.endsWith('.undefined')) continue // placeholder, S3 returns 403
    map.set(d.name_spanish, `${COCINOTECA_CDN}/${d.image}`)
  }
  return map
}

// ── pipeline ────────────────────────────────────────────────────────────────

async function rehostMap(map, folder) {
  const out = {}
  let i = 0
  const total = map.size
  for (const [name, sourceUrl] of map) {
    i++
    process.stdout.write(`  [${i}/${total}] ${name.slice(0, 48).padEnd(48)} `)
    try {
      const fetched = await fetchImageAsDataUri(sourceUrl)
      if (!fetched) {
        console.log('SKIP (source fetch failed)')
        continue
      }
      const finalUrl = await uploadToAssets(fetched.dataUri, folder)
      out[name] = finalUrl
      console.log(`OK ${(fetched.bytes / 1024).toFixed(0)}kb`)
    } catch (e) {
      console.log(`ERR ${e.message}`)
    }
  }
  return out
}

async function main() {
  console.log(`Asset API: ${ASSET_API_BASE}`)
  console.log('\n── Hannah & Michael (UberEats) ──')
  const hmHtml = await fetchText(UBEREATS_URL)
  const hmMap = parseHannahMichael(hmHtml)
  console.log(`Source items with image: ${hmMap.size}`)
  const hmOut = await rehostMap(hmMap, 'menu-hm')
  await fs.writeFile('/tmp/menu-image-map-hm.json', JSON.stringify(hmOut, null, 2))
  console.log(`\nRe-hosted: ${Object.keys(hmOut).length} → /tmp/menu-image-map-hm.json`)

  console.log('\n── La Cocinoteca ──')
  const coHtml = await fetchText(COCINOTECA_URL)
  const coMap = parseCocinoteca(coHtml)
  console.log(`Source items with image: ${coMap.size}`)
  const coOut = await rehostMap(coMap, 'menu-cocinoteca')
  await fs.writeFile('/tmp/menu-image-map-cocinoteca.json', JSON.stringify(coOut, null, 2))
  console.log(`\nRe-hosted: ${Object.keys(coOut).length} → /tmp/menu-image-map-cocinoteca.json`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
