import type { FontRef } from '../types/invitation.types'
import { fontshareSlug } from './usePageChrome'

/**
 * On-demand font loading for the font picker. Each visible row loads a tiny
 * preview subset of its family; assigning a font to a slot loads the full
 * weights. Links are deduplicated module-wide so scrolling back and forth
 * never re-injects anything.
 */

const loaded = new Set<string>()

function injectStylesheet(href: string, key: string) {
  if (loaded.has(key)) return
  loaded.add(key)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.setAttribute('data-font-preview', '1')
  link.href = href
  document.head.appendChild(link)
}

/**
 * Loads just enough of the font to render `sampleText` (Google's `text=`
 * subsetting keeps the woff2 to a few KB). Fontshare has no `text=` support,
 * so those load weight 400 complete — fine for a ~18 family curated list.
 */
export function loadPreviewFont(ref: FontRef, sampleText: string) {
  if (typeof document === 'undefined' || !ref.family?.trim()) return
  const family = ref.family.trim()
  if (ref.provider === 'fontshare') {
    injectStylesheet(
      `https://api.fontshare.com/v2/css?f[]=${fontshareSlug(family)}@400&display=swap`,
      `fontshare:${family}:preview`,
    )
    return
  }
  // Include the family name in the subset so the row label also renders.
  const text = encodeURIComponent(
    Array.from(new Set((sampleText + family).split(''))).join(''),
  )
  const fam = encodeURIComponent(family).replace(/%20/g, '+')
  injectStylesheet(
    `https://fonts.googleapis.com/css2?family=${fam}:wght@400&display=swap&text=${text}`,
    `google:${family}:preview:${sampleText}`,
  )
}

/** Full weights — call when the font is actually assigned to a slot. */
export function loadFullFont(ref: FontRef) {
  if (typeof document === 'undefined' || !ref.family?.trim()) return
  const family = ref.family.trim()
  const weights = ref.weights?.length ? ref.weights : ['400', '500', '600', '700']
  if (ref.provider === 'fontshare') {
    injectStylesheet(
      `https://api.fontshare.com/v2/css?f[]=${fontshareSlug(family)}@${weights.join(',')}&display=swap`,
      `fontshare:${family}:full`,
    )
    return
  }
  const fam = encodeURIComponent(family).replace(/%20/g, '+')
  injectStylesheet(
    `https://fonts.googleapis.com/css2?family=${fam}:wght@${weights.join(';')}&display=swap`,
    `google:${family}:full`,
  )
}
