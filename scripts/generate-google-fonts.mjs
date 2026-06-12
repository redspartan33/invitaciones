// Regenerates src/data/googleFonts.json with the full Google Fonts catalog.
// Run manually when you want to refresh the list:
//   node scripts/generate-google-fonts.mjs
// No API key needed — uses the public metadata endpoint. The JSON is
// committed so the app never hits the network for the catalog at runtime.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../src/data/googleFonts.json')

const res = await fetch('https://fonts.google.com/metadata/fonts')
if (!res.ok) {
  console.error(`fonts.google.com responded ${res.status}`)
  process.exit(1)
}
let text = await res.text()
// Historically the endpoint prefixed the JSON with )]}' — strip it if present.
if (text.startsWith(")]}'")) text = text.slice(4)
const meta = JSON.parse(text)

const CATEGORY_MAP = {
  Serif: 'serif',
  'Sans Serif': 'sans-serif',
  Display: 'display',
  Handwriting: 'handwriting',
  Monospace: 'monospace',
}

// Sorted by popularity so the picker shows the most-used families first.
const families = [...meta.familyMetadataList]
  .sort((a, b) => (a.popularity ?? 1e9) - (b.popularity ?? 1e9))
  .map((f) => ({ f: f.family, c: CATEGORY_MAP[f.category] ?? 'display' }))

writeFileSync(OUT, JSON.stringify(families))
console.log(`Wrote ${families.length} families to ${OUT}`)
