/**
 * Backfill dish images into existing menu invitations on the server.
 *
 * Reads the per-restaurant manifests written by scrape-menu-images.mjs
 * (/tmp/menu-image-map-{hm,cocinoteca}.json), walks every menu-section block,
 * matches items by name and attaches `image`. Also turns on
 * globalSettings.enableItemImages so the editor / public view renders the
 * thumbnails.
 *
 * Usage:
 *   node scripts/backfill-menu-images.mjs
 *
 * Env:
 *   API_BASE  default https://api.lamartinasma.com
 */
import fs from 'node:fs/promises'

const API_BASE = process.env.API_BASE || 'https://api.lamartinasma.com'

// Each menu lives in TWO server files: the published copy (filename =
// publicSlug) that visitors see, and the editor's working copy
// (filename = `draft-<invitation id>`). We must patch BOTH — otherwise the
// next time the menu is opened in the editor it loads the image-less draft
// and re-publishing wipes the photos again. `slug` is whatever goes in the
// /api/invitations/:id URL.
const TARGETS = [
  { label: 'Hannah & Michael — publicado', slug: 'GUKkeGDjg', mapping: '/tmp/menu-image-map-hm.json' },
  { label: 'Hannah & Michael — draft', slug: 'draft-ea03416a-9238-4542-8e59-543bff1d8817', mapping: '/tmp/menu-image-map-hm.json' },
  { label: 'La Cocinoteca — publicado', slug: 'zAamzQNFa', mapping: '/tmp/menu-image-map-cocinoteca.json' },
  { label: 'La Cocinoteca — draft', slug: 'draft-cbc42022-3235-4c12-96ab-2c3e139f0648', mapping: '/tmp/menu-image-map-cocinoteca.json' },
]

async function loadInvitation(slug) {
  const res = await fetch(`${API_BASE}/api/invitations/${slug}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`GET /api/invitations/${slug} → ${res.status}`)
  return res.json()
}

async function saveInvitation(slug, inv) {
  const res = await fetch(`${API_BASE}/api/invitations/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inv),
  })
  if (!res.ok) throw new Error(`PUT /api/invitations/${slug} → ${res.status} ${await res.text().catch(() => '')}`)
  return res.json()
}

function patchInvitation(inv, imageByName) {
  let matched = 0
  let totalItems = 0
  let alreadyHadImage = 0
  for (const block of inv.blocks || []) {
    if (block.type !== 'menu-section') continue
    const items = block?.data?.items || []
    for (const it of items) {
      totalItems++
      if (it.image) alreadyHadImage++
      const url = imageByName[it.name]
      if (url) {
        it.image = url
        matched++
      }
    }
  }
  inv.globalSettings = inv.globalSettings || {}
  inv.globalSettings.enableItemImages = true
  inv.updatedAt = new Date().toISOString()
  return { matched, totalItems, alreadyHadImage }
}

async function main() {
  console.log(`API: ${API_BASE}\n`)
  for (const t of TARGETS) {
    console.log(`── ${t.label} (${t.slug}) ──`)
    const map = JSON.parse(await fs.readFile(t.mapping, 'utf8'))
    console.log(`  manifest: ${Object.keys(map).length} entries`)
    const inv = await loadInvitation(t.slug)
    console.log(`  loaded:   id=${inv.id} blocks=${inv.blocks?.length} status=${inv.status}`)
    const { matched, totalItems, alreadyHadImage } = patchInvitation(inv, map)
    console.log(`  patched:  ${matched}/${totalItems} items now have an image (${alreadyHadImage} already had one)`)
    console.log(`  flag:     enableItemImages = true`)
    await saveInvitation(t.slug, inv)
    console.log('  saved ✓\n')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
