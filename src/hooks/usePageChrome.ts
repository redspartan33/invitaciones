import { useEffect } from 'react'

function googleFontsUrl(families: string[]): string | null {
  const clean = families.filter(Boolean).map((f) => f.trim()).filter(Boolean)
  if (clean.length === 0) return null
  const params = clean
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

/**
 * Apply the invitation's chosen favicon and Google Fonts to the document.
 *
 * - Favicon: swaps the existing <link rel="icon"> (or appends one). On
 *   unmount/empty, restores the previous href so the editor's own icon
 *   isn't permanently overridden.
 * - Google Fonts: appends a single <link> tag tagged with
 *   data-invitation-fonts so it can be replaced cleanly when the user
 *   picks different fonts.
 */
export function usePageChrome({
  favicon,
  headingFont,
  bodyFont,
}: {
  favicon?: string
  headingFont?: string
  bodyFont?: string
}) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const head = document.head
    let link = head.querySelector<HTMLLinkElement>('link[rel="icon"]')
    const original = link?.getAttribute('href') ?? null
    const ownedByUs = !!favicon

    if (favicon) {
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        head.appendChild(link)
      }
      link.href = favicon
    }

    return () => {
      if (!ownedByUs) return
      if (!link) return
      if (original) link.setAttribute('href', original)
      else link.remove()
    }
  }, [favicon])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const families = [headingFont, bodyFont].filter((s): s is string => !!s?.trim())
    const url = googleFontsUrl(families)

    const existing = document.head.querySelector<HTMLLinkElement>('link[data-invitation-fonts]')
    if (existing) existing.remove()
    if (!url) return undefined

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.setAttribute('data-invitation-fonts', '1')
    link.href = url
    document.head.appendChild(link)

    return () => {
      link.remove()
    }
  }, [headingFont, bodyFont])
}
