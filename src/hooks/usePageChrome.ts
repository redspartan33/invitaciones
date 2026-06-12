import { useEffect, useMemo } from 'react'
import type { FontRef } from '../types/invitation.types'

const DEFAULT_WEIGHTS = ['400', '500', '600', '700']

/** Single CDN constant: swap to https://fonts.bunny.net/css for a GDPR
 *  mirror of the same Google catalog without touching anything else. */
const GOOGLE_FONT_CDN = 'https://fonts.googleapis.com/css2'
const FONTSHARE_CDN = 'https://api.fontshare.com/v2/css'

export const fontshareSlug = (family: string) =>
  family.trim().toLowerCase().replace(/\s+/g, '-')

function googleFontsUrl(fonts: FontRef[]): string | null {
  if (fonts.length === 0) return null
  const params = fonts
    .map((f) => {
      const weights = (f.weights?.length ? f.weights : DEFAULT_WEIGHTS).join(';')
      return `family=${encodeURIComponent(f.family.trim()).replace(/%20/g, '+')}:wght@${weights}`
    })
    .join('&')
  return `${GOOGLE_FONT_CDN}?${params}&display=swap`
}

function fontshareUrl(fonts: FontRef[]): string | null {
  if (fonts.length === 0) return null
  const params = fonts
    .map((f) => {
      const weights = (f.weights?.length ? f.weights : DEFAULT_WEIGHTS).join(',')
      return `f[]=${fontshareSlug(f.family)}@${weights}`
    })
    .join('&')
  return `${FONTSHARE_CDN}?${params}&display=swap`
}

/**
 * Apply the invitation's chosen favicon and web fonts to the document.
 *
 * - Favicon: swaps the existing <link rel="icon"> (or appends one). On
 *   unmount/empty, restores the previous href so the editor's own icon
 *   isn't permanently overridden.
 * - Fonts: appends one stylesheet <link> per provider (Google css2 /
 *   Fontshare), tagged with data-invitation-fonts so they can be replaced
 *   cleanly when the user picks different fonts.
 */
export function usePageChrome({
  favicon,
  fonts,
  title,
}: {
  favicon?: string
  fonts?: FontRef[]
  title?: string
}) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const next = title?.trim()
    if (!next) return
    const original = document.title
    document.title = next
    return () => {
      document.title = original
    }
  }, [title])


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

  // Stable key so the effect only re-runs when the actual font set changes,
  // not on every render (callers may build the array inline).
  const fontsKey = useMemo(
    () =>
      (fonts ?? [])
        .filter((f) => !!f?.family?.trim())
        .map((f) => `${f.provider}:${f.family}:${(f.weights ?? []).join(',')}`)
        .sort()
        .join('|'),
    [fonts],
  )

  useEffect(() => {
    if (typeof document === 'undefined') return
    const clean = (fonts ?? []).filter((f) => !!f?.family?.trim())
    const urls = [
      googleFontsUrl(clean.filter((f) => f.provider !== 'fontshare')),
      fontshareUrl(clean.filter((f) => f.provider === 'fontshare')),
    ].filter((u): u is string => !!u)

    document.head
      .querySelectorAll<HTMLLinkElement>('link[data-invitation-fonts]')
      .forEach((el) => el.remove())
    if (urls.length === 0) return undefined

    const links = urls.map((url) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.setAttribute('data-invitation-fonts', '1')
      link.href = url
      document.head.appendChild(link)
      return link
    })

    return () => {
      links.forEach((l) => l.remove())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsKey])
}
