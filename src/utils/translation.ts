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
  /** Block type the string came from — used by translateOne to pick the
   *  right context preamble (menu vs invitation). */
  context: TranslationContext
}

/** Block types that ship with a restaurant-menu vocabulary. Anything else
 *  defaults to the generic "invitation" context. */
const MENU_BLOCK_TYPES = new Set<BlockType>([
  'menu-header',
  'menu-section',
  'menu-footer',
  'menu-note',
])

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
    const context: TranslationContext = MENU_BLOCK_TYPES.has(block.type)
      ? 'menu'
      : 'invitation'
    const data = block.data as Record<string, unknown>
    for (const spec of specs) {
      if (typeof spec === 'string') {
        const v = data[spec]
        if (typeof v === 'string' && v.trim()) {
          out.push({ blockId: block.id, path: spec, text: v, context })
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
                    context,
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

/** Why context matters: without a hint, free MT providers strip ambiguity
 *  out of short menu words. Google turned "Carta" → "Letter", "Entradas" →
 *  "Tickets", "Platillo de ejemplo" → "Example saucer" — all plausible
 *  general translations, but catastrophically wrong for a restaurant menu,
 *  which is what made the user say "las traducciones no están sirviendo".
 *
 *  We work around the lack of a `context` field on the gtx endpoint by
 *  prepending a Spanish category preamble to each string. The whole
 *  preamble + text is translated as one phrase, so Google can use the
 *  preamble as semantic context. After translation we strip the leading
 *  translated preamble back out, so the user only sees the content. */
type TranslationContext = 'menu' | 'invitation' | 'none'

const CONTEXT_PREAMBLE_ES: Record<TranslationContext, string> = {
  menu: 'Menú de restaurante: ',
  invitation: 'Invitación de evento: ',
  none: '',
}

/**
 * Translate a single text. We try Google's free, unauthenticated `gtx`
 * endpoint first (better quality than MyMemory after we add a context
 * preamble), and fall back to MyMemory if Google fails. Both endpoints
 * are CORS-enabled and key-less. On any failure we return the original
 * text so publish never blocks.
 */
async function translateOne(
  text: string,
  target: Language,
  source: Language = 'es',
  context: TranslationContext = 'none',
): Promise<string> {
  if (source === target) return text
  const fromGoogle = await translateViaGoogle(text, target, source, context)
  if (fromGoogle && fromGoogle !== text) return fromGoogle
  // Google failed (or returned text unchanged) — try MyMemory as a backup.
  const fromMyMemory = await translateViaMyMemory(text, target, source)
  return fromMyMemory || text
}

/** Google Translate's unauthenticated `gtx` endpoint. Returns an array of
 *  translation segments; we concatenate them so multi-sentence inputs round-
 *  trip cleanly. The `context` adds a Spanish preamble for disambiguation
 *  (see CONTEXT_PREAMBLE_ES) and we strip its translated form back off. */
async function translateViaGoogle(
  text: string,
  target: Language,
  source: Language,
  context: TranslationContext,
): Promise<string | null> {
  const preamble = source === 'es' ? CONTEXT_PREAMBLE_ES[context] : ''
  const q = preamble + text
  try {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(q)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = (await res.json()) as unknown
    // Response shape: [[[ "translated", "original", null, null, ...], ...], ...]
    if (!Array.isArray(json) || !Array.isArray(json[0])) return null
    const parts: string[] = []
    for (const seg of json[0] as unknown[]) {
      if (Array.isArray(seg) && typeof seg[0] === 'string') parts.push(seg[0])
    }
    let out = parts.join('').trim()
    if (!out) return null
    // Strip the translated preamble. Google translates "Menú de restaurante: "
    // into the target language's equivalent ("Restaurant menu: ", "Menu du
    // restaurant : ", …). We don't know the exact target form, but the colon
    // separator survives, so splitting on the FIRST ": " (or " : " for FR)
    // and taking the remainder reliably recovers the translated content even
    // when the user's own text contains additional colons.
    if (preamble) {
      const m = /^[^:]*:\s+/.exec(out)
      if (m) out = out.slice(m[0].length).trim()
    }
    return out || null
  } catch {
    return null
  }
}

/** MyMemory free tier (1k words/day anon). Kept as the second-stage fallback
 *  for the rare case where Google's gtx endpoint is blocked or down. */
async function translateViaMyMemory(text: string, target: Language, source: Language): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = (await res.json()) as { responseData?: { translatedText?: string } }
    const translated = json.responseData?.translatedText
    if (typeof translated !== 'string' || !translated.trim()) return null
    // MyMemory sometimes echoes guidance strings like "PLEASE SELECT TWO
    // DISTINCT LANGUAGES" — skip anything that's all uppercase ASCII.
    if (/^[A-Z\s]+$/.test(translated) && translated.length < 50) return null
    return decodeHtmlEntities(translated)
  } catch {
    return null
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
    const translated = await pMap(strings, 4, (s) =>
      translateOne(s.text, target, 'es', s.context),
    )
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
