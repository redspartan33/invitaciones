/**
 * Stable DOM anchor id for a menu section. We combine a slug of the title
 * with the last segment of the block id so changing the title keeps the
 * anchor reachable while still being human-readable in the URL hash.
 */
export function menuSectionAnchor(blockId: string, title: string): string {
  const slug = (title || 'seccion')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'seccion'
  const tail = blockId.slice(-6)
  return `${slug}-${tail}`
}
