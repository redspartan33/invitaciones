import type {
  BlockType,
  Invitation,
  InvitationBlock,
  Language,
  TranslationMap,
} from '../types/invitation.types'

export const LANGUAGE_LABELS: Record<Language, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
}

/**
 * Per-block whitelist of field paths whose string values should be
 * translated. Entries are either:
 *   - 'fieldName'  → translate `data.fieldName`
 *   - { array: 'items', fields: ['name', 'description'] }
 *       → translate `data.items[i].name` and `data.items[i].description`
 */
type FieldSpec = string | { array: string; fields: string[] }

const TRANSLATABLE: Partial<Record<BlockType, FieldSpec[]>> = {
  hero: ['title', 'subtitle'],
  'event-details': ['location', 'address', 'description'],
  timeline: ['title', { array: 'items', fields: ['title', 'description'] }],
  'dress-code': ['code', 'notes'],
  'gift-registry': [
    'title',
    'message',
    { array: 'items', fields: ['storeName', 'description'] },
  ],
  'rsvp-info': ['instructions', 'whatsappMessage', 'whatsappButtonLabel'],
  footer: ['message'],
  gallery: ['title', { array: 'images', fields: ['caption'] }],
  'image-set': ['title', { array: 'images', fields: ['caption'] }],
  map: ['title', 'address', 'openLinkLabel'],
  'menu-header': [
    'title',
    'tagline',
    { array: 'navItems', fields: ['label'] },
  ],
  'menu-section': [
    'title',
    'description',
    { array: 'items', fields: ['name', 'description', 'badges'] },
  ],
  'menu-note': ['text'],
  'menu-footer': ['address', 'hours'],
}

interface CollectedString {
  blockId: string
  path: string
  text: string
}

/**
 * Walk every block and produce a flat list of (blockId, path, text) for
 * every translatable string. The path mirrors how the value is reached
 * from `block.data` (e.g. 'title' or 'items[2].name'). Empty / whitespace
 * strings are skipped.
 */
export function collectTranslatableStrings(blocks: InvitationBlock[]): CollectedString[] {
  const out: CollectedString[] = []
  for (const block of blocks) {
    const specs = TRANSLATABLE[block.type]
    if (!specs) continue
    const data = block.data as Record<string, unknown>
    for (const spec of specs) {
      if (typeof spec === 'string') {
        const v = data[spec]
        if (typeof v === 'string' && v.trim()) {
          out.push({ blockId: block.id, path: spec, text: v })
        }
      } else {
        const arr = data[spec.array]
        if (Array.isArray(arr)) {
          arr.forEach((item, i) => {
            if (item && typeof item === 'object') {
              for (const f of spec.fields) {
                const v = (item as Record<string, unknown>)[f]
                if (typeof v === 'string' && v.trim()) {
                  out.push({
                    blockId: block.id,
                    path: `${spec.array}[${i}].${f}`,
                    text: v,
                  })
                }
              }
            }
          })
        }
      }
    }
  }
  return out
}

/**
 * Translate a single text via the free MyMemory API. The endpoint is
 * CORS-enabled and key-less for low volume (1k words/day anon, ~50k with
 * an email). On any failure we return the original text so the publish
 * flow never blocks on translation.
 */
async function translateOne(text: string, target: Language, source: Language = 'es'): Promise<string> {
  if (source === target) return text
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`
    const res = await fetch(url)
    if (!res.ok) return text
    const json = (await res.json()) as { responseData?: { translatedText?: string } }
    const translated = json.responseData?.translatedText
    if (typeof translated === 'string' && translated.trim()) {
      // MyMemory sometimes returns "PLEASE SELECT TWO DISTINCT LANGUAGES" or
      // HTML-encoded entities — basic guard + decode common entities.
      if (/^[A-Z\s]+$/.test(translated) && translated.length < 50) return text
      return decodeHtmlEntities(translated)
    }
    return text
  } catch {
    return text
  }
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/** Run a list of async tasks with bounded concurrency. */
async function pMap<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return results
}

/**
 * Translate every translatable string in an invitation to each target
 * language. Returns a new translations map shaped as
 * `{ [blockId]: { [lang]: { [path]: translated } } }`. Skips 'es' (source).
 */
export async function buildTranslations(
  invitation: Invitation,
  targets: Language[],
): Promise<Record<string, TranslationMap>> {
  const wantedTargets = targets.filter((l) => l !== 'es')
  if (wantedTargets.length === 0) return {}

  const strings = collectTranslatableStrings(invitation.blocks)
  if (strings.length === 0) return {}

  const out: Record<string, TranslationMap> = {}

  for (const target of wantedTargets) {
    const translated = await pMap(strings, 4, (s) => translateOne(s.text, target))
    strings.forEach((s, i) => {
      const blockEntry = (out[s.blockId] ??= {})
      const langEntry = (blockEntry[target] ??= {})
      langEntry[s.path] = translated[i]
    })
  }

  return out
}

/**
 * Return a shallow clone of the block where every translatable field is
 * swapped for the value in the translation map for the requested language.
 * If the requested language is 'es' or no translation exists, returns the
 * original block unchanged.
 */
export function applyBlockTranslation<T extends InvitationBlock>(
  block: T,
  language: Language,
  translations: Record<string, TranslationMap> | undefined,
): T {
  if (language === 'es') return block
  const blockMap = translations?.[block.id]?.[language]
  if (!blockMap) return block
  const specs = TRANSLATABLE[block.type]
  if (!specs) return block

  const data = { ...(block.data as Record<string, unknown>) }
  for (const spec of specs) {
    if (typeof spec === 'string') {
      const t = blockMap[spec]
      if (typeof t === 'string') data[spec] = t
    } else {
      const arr = data[spec.array]
      if (Array.isArray(arr)) {
        data[spec.array] = arr.map((item, i) => {
          if (!item || typeof item !== 'object') return item
          const next = { ...(item as Record<string, unknown>) }
          for (const f of spec.fields) {
            const t = blockMap[`${spec.array}[${i}].${f}`]
            if (typeof t === 'string') next[f] = t
          }
          return next
        })
      }
    }
  }
  return { ...block, data: data as T['data'] }
}
