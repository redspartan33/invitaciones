import { createContext, useContext, useState, type ReactNode } from 'react'
import type { PromoBannerConfig } from '../../types/invitation.types'

interface MenuFeaturesValue {
  /** Free-text query coming from the sticky-nav search input. Empty string
   *  means no active filter. */
  searchQuery: string
  setSearchQuery: (q: string) => void
  /** When true, MenuSectionBlock renders dish thumbnails. */
  showItemImages: boolean
  /** When true, MenuHeaderBlock renders the search icon + expandable input. */
  enableSearch: boolean
  /** When set + enabled, MenuHeaderBlock renders the header + promo slides
   *  as a single horizontal auto-rotating carousel (header = slide 0). */
  promoBanner?: PromoBannerConfig
}

const Ctx = createContext<MenuFeaturesValue>({
  searchQuery: '',
  setSearchQuery: () => {},
  showItemImages: false,
  enableSearch: false,
  promoBanner: undefined,
})

export function MenuFeaturesProvider({
  showItemImages,
  enableSearch,
  promoBanner,
  children,
}: {
  showItemImages: boolean
  enableSearch: boolean
  promoBanner?: PromoBannerConfig
  children: ReactNode
}) {
  const [searchQuery, setSearchQuery] = useState('')
  return (
    <Ctx.Provider value={{ searchQuery, setSearchQuery, showItemImages, enableSearch, promoBanner }}>
      {children}
    </Ctx.Provider>
  )
}

export function useMenuFeatures(): MenuFeaturesValue {
  return useContext(Ctx)
}

/** Lowercase + strip accents — used by the menu search to match
 *  case-insensitively and ignore diacritics. */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
