/**
 * One-shot migration: Vercel Blob  →  your own server (api.lamartinasma.com).
 *
 * Reads every invitation (`inv/*.json`) and guest list (`guests/*.json`) from
 * the Vercel Blob store and re-writes them onto the Express server's
 * filesystem via its public API. While migrating invitations it also rewrites
 * each RSVP block's `guestListLink` so the guest link points at the new public
 * origin instead of the old *.vercel.app domain.
 *
 * NON-DESTRUCTIVE:
 *   - Guest lists are MERGED by id with whatever is already on the server — the
 *     server's existing confirmations are never dropped, we only add entries
 *     from Vercel whose id isn't already present. Original id/createdAt kept.
 *   - Invitations are skipped when the server already has an equal-or-newer
 *     version (by updatedAt), so a re-run never regresses newer work.
 *
 * SAFETY: dry-run by default. Nothing is written unless you pass APPLY=1.
 *
 * Usage:
 *   # 1) dry run — see exactly what would happen, writes nothing
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx \
 *   NEW_ORIGIN=https://lamartinasma.com \
 *   node scripts/migrate-from-vercel.mjs
 *
 *   # 2) for real
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx \
 *   NEW_ORIGIN=https://lamartinasma.com \
 *   APPLY=1 node scripts/migrate-from-vercel.mjs
 *
 * Env:
 *   BLOB_READ_WRITE_TOKEN  (required)  Vercel Blob read/write token.
 *   NEW_ORIGIN             (required)  New public origin for guest links,
 *                                      e.g. https://lamartinasma.com (no trailing slash).
 *   TARGET_API             (default https://api.lamartinasma.com)  Destination server.
 *   APPLY                  (unset = dry run)  Set to 1 to actually write.
 *   ONLY_INV              (optional)  Comma-separated invitation ids to limit to.
 */

import { list, get } from '@vercel/blob'

const token = process.env.BLOB_READ_WRITE_TOKEN
const NEW_ORIGIN = (process.env.NEW_ORIGIN || '').replace(/\/+$/, '')
const TARGET_API = (process.env.TARGET_API || 'https://api.lamartinasma.com').replace(/\/+$/, '')
const APPLY = process.env.APPLY === '1' || process.env.APPLY === 'true'
const REWRITE_SHARED = process.env.REWRITE_SHARED === '1' || process.env.REWRITE_SHARED === 'true'
const ONLY_INV = (process.env.ONLY_INV || '').split(',').map((s) => s.trim()).filter(Boolean)

if (!token) {
  console.error('✗ BLOB_READ_WRITE_TOKEN is required (Vercel Blob read/write token).')
  process.exit(1)
}
if (!NEW_ORIGIN) {
  console.error('✗ NEW_ORIGIN is required, e.g. NEW_ORIGIN=https://lamartinasma.com')
  process.exit(1)
}

console.log(`Mode:        ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes)'}`)
console.log(`Target API:  ${TARGET_API}`)
console.log(`New origin:  ${NEW_ORIGIN}`)
if (ONLY_INV.length) console.log(`Only inv:    ${ONLY_INV.join(', ')}`)
console.log('')

/** List every blob under a prefix, following pagination cursors. */
async function listAll(prefix) {
  const out = []
  let cursor
  do {
    const page = await list({ prefix, cursor, token })
    out.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
  return out.filter((b) => b.pathname.endsWith('.json'))
}

/** Read a blob's text content (private store, cache bypassed). */
async function readBlob(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false, token })
  if (!r || r.statusCode !== 200) throw new Error(`get ${pathname} → status ${r?.statusCode}`)
  return await new Response(r.stream).text()
}

/** Swap the origin of an absolute URL onto NEW_ORIGIN, keeping path + query. */
function swapOrigin(url) {
  try {
    const u = new URL(url)
    return `${NEW_ORIGIN}${u.pathname}${u.search}`
  } catch {
    return url
  }
}

/**
 * Rewrite each rsvp-info block's guestListLink onto NEW_ORIGIN (slug kept), and
 * — when REWRITE_SHARED is on — the invitation's top-level sharedLink too.
 */
function rewriteGuestLinks(inv) {
  let changed = 0
  for (const b of inv.blocks || []) {
    if (b?.type === 'rsvp-info' && b?.data?.guestListSlug) {
      const next = `${NEW_ORIGIN}/?guestlist=${b.data.guestListSlug}`
      if (b.data.guestListLink !== next) {
        b.data.guestListLink = next
        changed++
      }
    }
  }
  if (REWRITE_SHARED && typeof inv.sharedLink === 'string' && inv.sharedLink) {
    const next = swapOrigin(inv.sharedLink)
    if (inv.sharedLink !== next) {
      inv.sharedLink = next
      changed++
    }
  }
  return changed
}

async function putJson(url, bodyObj) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyObj),
  })
  if (!res.ok) throw new Error(`PUT ${url} → HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json().catch(() => ({}))
}

/** GET parsed JSON, or null on 404. Used to read the server's current state. */
async function getJson(url) {
  const res = await fetch(url)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`)
  return res.json().catch(() => null)
}

async function migrateInvitations() {
  const blobs = await listAll('inv/')
  console.log(`Invitations on Vercel: ${blobs.length}`)
  let ok = 0, skipped = 0, failed = 0
  for (const b of blobs) {
    const id = b.pathname.replace(/^inv\//, '').replace(/\.json$/, '')
    if (ONLY_INV.length && !ONLY_INV.includes(id)) { skipped++; continue }
    try {
      const inv = JSON.parse(await readBlob(b.pathname))
      // NON-DESTRUCTIVE: never regress a server invitation that is equal or newer.
      const current = await getJson(`${TARGET_API}/api/invitations/${id}`)
      if (current && current.updatedAt && inv.updatedAt && String(current.updatedAt) >= String(inv.updatedAt)) {
        console.log(`  ⤳ skip inv ${id} (server ya tiene versión igual/más nueva: ${current.updatedAt})`)
        skipped++
        continue
      }
      const linkChanges = rewriteGuestLinks(inv)
      if (APPLY) await putJson(`${TARGET_API}/api/invitations/${id}`, inv)
      console.log(`  ${APPLY ? '→' : '(dry)'} inv ${id}  (links rewritten: ${linkChanges})`)
      ok++
    } catch (e) {
      console.error(`  ✗ inv ${id}: ${e.message}`)
      failed++
    }
  }
  console.log(`Invitations: ${ok} written, ${skipped} skipped, ${failed} failed\n`)
}

async function migrateGuestLists() {
  const blobs = await listAll('guests/')
  console.log(`Guest lists on Vercel: ${blobs.length}`)
  let ok = 0, failed = 0, totalEntries = 0
  for (const b of blobs) {
    const slug = b.pathname.replace(/^guests\//, '').replace(/\.json$/, '')
    try {
      const parsed = JSON.parse(await readBlob(b.pathname))
      const vercelEntries = Array.isArray(parsed) ? parsed : []
      // NON-DESTRUCTIVE: union with whatever is already on the server, deduped by
      // id. The server's existing confirmations are NEVER dropped — we only add
      // entries from Vercel whose id isn't already present.
      const current = (await getJson(`${TARGET_API}/api/guestlists/${slug}`)) || []
      const byId = new Map()
      for (const e of current) if (e && e.id) byId.set(e.id, e)
      let added = 0
      for (const e of vercelEntries) if (e && e.id && !byId.has(e.id)) { byId.set(e.id, e); added++ }
      const merged = [...byId.values()].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      totalEntries += merged.length
      if (APPLY) {
        const r = await putJson(`${TARGET_API}/api/guestlists/${slug}`, merged)
        console.log(`  → guests ${slug}  (server ${current.length} + vercel ${vercelEntries.length} → ${r.count ?? merged.length}; ${added} nuevas de vercel)`)
      } else {
        console.log(`  (dry) guests ${slug}  (server ${current.length} + vercel ${vercelEntries.length} → ${merged.length}; ${added} nuevas de vercel)`)
      }
      ok++
    } catch (e) {
      console.error(`  ✗ guests ${slug}: ${e.message}`)
      failed++
    }
  }
  console.log(`Guest lists: ${ok} written, ${failed} failed, ${totalEntries} confirmaciones en total\n`)
}

await migrateInvitations()
await migrateGuestLists()
console.log(APPLY ? '✓ Migration complete.' : '✓ Dry run complete — re-run with APPLY=1 to write.')
