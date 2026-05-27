import { createContext, useContext, useState, type ReactNode } from 'react'

interface MenuFeaturesValue {
  /** Free-text query coming from the sticky-nav search input. Empty string
   *  means no active filter. */
  searchQuery: string
  setSearchQuery: (q: string) => void
  /** When true, MenuSectionBlock renders dish thumbnails. */
  showItemImages: boolean
  /** When true, MenuHeaderBlock renders the search icon + expandable input. */
  enableSearch: boolean
}

const Ctx = createContext<MenuFeaturesValue>({
  searchQuery: '',
  setSearchQuery: () => {},
  showItemImages: false,
  enableSearch: false,
})

export function MenuFeaturesProvider({
  showItemImages,
  enableSearch,
  children,
}: {
  showItemImages: boolean
  enableSearch: boolean
  children: ReactNode
}) {
  const [searchQuery, setSearchQuery] = useState('')
  return (
    <Ctx.Provider value={{ searchQuery, setSearchQuery, showItemImages, enableSearch }}>
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
