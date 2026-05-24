/**
 * Slugify a string into an anchor-safe id (ASCII, lowercase, dashes).
 * Used both for auto-derived anchors and for sanitizing user-typed
 * customAnchor values so the URL fragment is always well-formed.
 */
export function slugifyAnchor(s: string, fallback = 'seccion'): string {
  const slug = (s || fallback)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64)
  return slug || fallback
}

/**
 * Stable DOM anchor id for a menu section.
 *
 * - When `customAnchor` is provided, we slugify it and use it as-is (the
 *   user explicitly chose this id, e.g. to keep the URL stable across
 *   title rewrites or to be targeted by a custom MenuHeader nav item).
 * - Otherwise we combine a slug of the title with the last segment of the
 *   block id so changing the title keeps the anchor reachable while still
 *   being human-readable in the URL hash.
 */
export function menuSectionAnchor(blockId: string, title: string, customAnchor?: string): string {
  if (customAnchor && customAnchor.trim()) {
    return slugifyAnchor(customAnchor)
  }
  const slug = slugifyAnchor(title)
  const tail = blockId.slice(-6)
  return `${slug}-${tail}`
}
