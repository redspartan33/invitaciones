import type { FontCategory } from '../types/invitation.types'

/**
 * Curated families from Fontshare (Indian Type Foundry) — free for personal
 * and commercial use under the ITF Free Font License. Served from
 * api.fontshare.com. The slug used in the CSS API is derived from the name
 * (lowercase, spaces → hyphens) by fontshareSlug() in usePageChrome.
 */
export interface FontshareFont {
  family: string
  category: FontCategory
}

export const FONTSHARE_FONTS: FontshareFont[] = [
  { family: 'Satoshi', category: 'sans-serif' },
  { family: 'General Sans', category: 'sans-serif' },
  { family: 'Cabinet Grotesk', category: 'sans-serif' },
  { family: 'Clash Display', category: 'display' },
  { family: 'Clash Grotesk', category: 'sans-serif' },
  { family: 'Switzer', category: 'sans-serif' },
  { family: 'Supreme', category: 'sans-serif' },
  { family: 'Author', category: 'sans-serif' },
  { family: 'Chillax', category: 'sans-serif' },
  { family: 'Synonym', category: 'sans-serif' },
  { family: 'Ranade', category: 'sans-serif' },
  { family: 'Sentient', category: 'serif' },
  { family: 'Zodiak', category: 'serif' },
  { family: 'Boska', category: 'serif' },
  { family: 'Gambetta', category: 'serif' },
  { family: 'Erode', category: 'serif' },
  { family: 'Bespoke Serif', category: 'serif' },
  { family: 'Panchang', category: 'display' },
]
