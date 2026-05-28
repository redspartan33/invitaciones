import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import type {
  InvitationBlock,
  Language,
  MenuHeaderData,
  MenuSectionData,
} from '../../types/invitation.types'
import { useEditorStore } from '../../store/editorStore'
import { TextEl } from './TextEl'
import { useSuppressBlockBackgrounds } from './BlockBackgroundContext'
import { useMenuFeatures } from './MenuFeaturesContext'
import { menuSectionAnchor } from '../../utils/menuNav'
import { LANGUAGE_LABELS } from '../../utils/translation'
import { ITEM_GAP_PX, PAD_Y_CLASS, BG_POSITION_CSS } from './BlockWrapper'
import { SearchIcon, CloseIcon } from './icons'
import { PromoSlideCard } from './PromoSlide'

const EMPTY_BLOCKS: InvitationBlock[] = []

interface Props {
  block: InvitationBlock<'menu-header'>
  /** When rendered standalone (e.g. public view) we read sections from props. */
  sectionsOverride?: { id: string; title: string }[]
  publicView?: boolean
  /** Enabled languages (incl. 'es'). When >1 the language switcher renders. */
  languages?: Language[]
  /** Currently selected language; controlled by the parent (public view). */
  currentLanguage?: Language
  /** Called when the visitor taps a language pill. */
  onLanguageChange?: (lang: Language) => void
}

export function MenuHeaderBlock({
  block,
  sectionsOverride,
  publicView,
  languages,
  currentLanguage,
  onLanguageChange,
}: Props) {
  const data = block.data as MenuHeaderData
  // Subscribe to the raw blocks array (stable reference across unrelated
  // store updates) and derive the nav list with useMemo. A prior version
  // mapped to fresh `{id, title}` objects inside the selector — with
  // zustand's Object.is equality that meant every unrelated store change
  // re-rendered this component with a brand-new `sections` array, which
  // re-fired the scrollspy/layout effects on every render and tripped
  // React's "Maximum update depth exceeded" guard.
  const storeBlocks = useEditorStore((s) =>
    s.invitation.kind === 'menu' ? s.invitation.blocks : EMPTY_BLOCKS,
  )
  const sectionsFromStore = useMemo(
    () =>
      storeBlocks
        .filter((b) => b.type === 'menu-section' && b.visible)
        .sort((a, b) => a.order - b.order)
        .map((b) => {
          const d = b.data as MenuSectionData
          return {
            id: menuSectionAnchor(b.id, d.title, d.customAnchor),
            title: d.title || 'Sección',
          }
        }),
    [storeBlocks],
  )
  // When the menu-header has custom navItems, those take precedence over
  // the auto-generated list — letting the user hide / rename / reorder /
  // add custom links by anchor. Memoize so `sections` keeps a stable
  // reference across renders (otherwise the scrollspy effect re-fires).
  const navOverride = useMemo(
    () =>
      data.navItems && data.navItems.length > 0
        ? data.navItems.map((it) => ({ id: it.targetAnchor, title: it.label }))
        : null,
    [data.navItems],
  )
  const sections = navOverride ?? sectionsOverride ?? sectionsFromStore
  const suppressBg = useSuppressBlockBackgrounds()
  // Background lives on block.style (the universal "Fondo del bloque" control),
  // falling back to legacy data.* fields so menus saved before the migration
  // keep their look.
  const bgImage = block.style?.backgroundImage || data.backgroundImage
  const bgColor = block.style?.backgroundColor || data.backgroundColor
  const usingImage = !!bgImage && !suppressBg
  const bgStyle = suppressBg
    ? // Global page background is visible behind the header — drop the dark
      // default so it shows through, and let text inherit the canvas color.
      ({} as React.CSSProperties)
    : usingImage
    ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: block.style?.backgroundSize ?? 'cover',
        backgroundPosition: BG_POSITION_CSS[block.style?.backgroundPosition ?? 'center'],
        color: '#fff',
      }
    : bgColor
    ? { backgroundColor: bgColor, color: '#fff' }
    : { backgroundColor: '#0b3d2e', color: '#fff' }

  const navBg = data.navBackgroundColor || '#0b3d2e'
  const navText = data.navTextColor || '#ffffff'

  const stickyHeader = data.stickyHeader === true
  const stickyNavOnly = !stickyHeader && data.stickyNavOnly === true
  const isPublicView = publicView === true || sectionsOverride !== undefined

  const navSize = data.navSize ?? 's'
  const logoSize = data.logoSize ?? 'm'

  const navItemClass =
    navSize === 'xl'
      ? 'px-4 py-2.5 text-[15px] tracking-[0.22em]'
      : navSize === 'm'
      ? 'px-3.5 py-2 text-[13px] tracking-[0.2em]'
      : 'px-3 py-1.5 text-[12px] tracking-[0.18em]'
  const navListClass =
    navSize === 'xl'
      ? 'gap-1.5 px-5 py-4'
      : navSize === 'm'
      ? 'gap-1.5 px-4 py-3'
      : 'gap-1 px-4 py-2.5'
  const logoClass =
    logoSize === 's'
      ? 'h-12'
      : logoSize === 'l'
      ? 'h-20'
      : logoSize === 'xl'
      ? 'h-28'
      : 'h-16'

  const headerRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLDivElement | null>(null)
  const navListRef = useRef<HTMLUListElement | null>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [navHeight, setNavHeight] = useState(0)
  const [navFixed, setNavFixed] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  useLayoutEffect(() => {
    const headerEl = headerRef.current
    const navEl = navRef.current
    if (!headerEl || !navEl) return
    setHeaderHeight(headerEl.offsetHeight)
    setNavHeight(navEl.offsetHeight)
  }, [data.title, data.tagline, bgImage, data.showLogo, data.showTitle, data.showTagline, navSize, logoSize, sections.length])

  useEffect(() => {
    if (!isPublicView || !stickyNavOnly || headerHeight <= 0) {
      setNavFixed(false)
      return undefined
    }

    const update = () => {
      setNavFixed(window.scrollY >= headerHeight)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [headerHeight, isPublicView, stickyNavOnly])

  // Deep-link: if the page arrives with a hash (e.g. ?id=foo#section),
  // wait until sections actually exist in the DOM, then scroll to the
  // target. Native anchor scroll fires before our async data loads.
  useEffect(() => {
    if (!isPublicView) return
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const target = document.getElementById(hash)
    if (!target) return
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }))
  }, [isPublicView, sections.length])

  // Scrollspy: as the user scrolls, mark the section currently sitting
  // just under the (possibly fixed) nav bar as active.
  useEffect(() => {
    if (!isPublicView || sections.length === 0) {
      setActiveId(null)
      return undefined
    }
    const stickyOffset =
      (stickyHeader ? headerHeight + navHeight : stickyNavOnly ? navHeight : 0) + 8

    const update = () => {
      let current: string | null = null
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top - stickyOffset <= 0) current = s.id
        else break
      }
      if (current === null && sections[0]) current = sections[0].id
      setActiveId(current)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [isPublicView, sections, stickyHeader, stickyNavOnly, headerHeight, navHeight])

  // Auto-scroll the (overflow-x) nav so the active item stays in view.
  useEffect(() => {
    if (!activeId) return
    const list = navListRef.current
    if (!list) return
    const active = list.querySelector<HTMLElement>(`a[data-section-id="${activeId}"]`)
    if (!active) return
    const scroller = list.parentElement
    if (!scroller) return
    const aLeft = active.offsetLeft
    const aRight = aLeft + active.offsetWidth
    const sLeft = scroller.scrollLeft
    const sRight = sLeft + scroller.clientWidth
    if (aLeft < sLeft) scroller.scrollTo({ left: aLeft - 16, behavior: 'smooth' })
    else if (aRight > sRight) scroller.scrollTo({ left: aRight - scroller.clientWidth + 16, behavior: 'smooth' })
  }, [activeId])

  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    // Native anchor scrolling is unreliable here because the sticky-nav
    // placeholder mounts on scroll and shifts the layout mid-jump. Drive
    // the scroll ourselves and update the hash without re-triggering the
    // browser's anchor algorithm.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    const target = document.getElementById(id)
    if (!target) return
    e.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    try {
      window.history.replaceState(null, '', `#${id}`)
    } catch {
      window.location.hash = id
    }
  }

  const showLangSwitcher = !!languages && languages.length > 1

  // ── Search overlay state. The icon lives in the sticky nav (right side);
  //    clicking it expands a full-width input across the nav. Only rendered
  //    on the public view because there's nothing to search in the editor.
  const { searchQuery, setSearchQuery, enableSearch, promoBanner } = useMenuFeatures()
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const showSearch = isPublicView && enableSearch
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])
  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
  }

  // Apply the same block-level layout knobs (padding, item spacing, text
  // size, text color) that every other block reads via BlockWrapper. Without
  // this, the sidebar sliders for "Espaciado vertical" and "Separación
  // entre elementos" silently did nothing on menu headers because this
  // block hardcoded `py-16` and used a fixed `mt-3` between elements.
  const blockStyle = block.style
  const hasCustomPadding = blockStyle?.paddingTop !== undefined || blockStyle?.paddingBottom !== undefined
  const paddingClass = hasCustomPadding
    ? 'px-6'
    : `${PAD_Y_CLASS[blockStyle?.paddingY ?? 'lg']} px-6`
  const textSizeClass = `block-text-${blockStyle?.textSize ?? 'md'}`
  const headerInlineStyle: CSSProperties = {
    ...bgStyle,
    paddingTop: blockStyle?.paddingTop !== undefined ? `${blockStyle.paddingTop}px` : undefined,
    paddingBottom: blockStyle?.paddingBottom !== undefined ? `${blockStyle.paddingBottom}px` : undefined,
    ...(blockStyle?.textColor ? { color: blockStyle.textColor } : undefined),
  }
  // Inner-element gap as a CSS variable, so the elements below can use it
  // via inline style and stay in sync with the universal "Separación entre
  // elementos internos" control.
  ;(headerInlineStyle as Record<string, string>)['--item-gap'] = ITEM_GAP_PX[blockStyle?.itemSpacing ?? 'md']

  // The "header card" — what used to be the only thing this block rendered.
  // Now it's slide 0 of an optional carousel (promos become slides 1+).
  const headerCard = (
    <div
      style={headerInlineStyle}
      className={`block-scale-active ${textSizeClass} ${paddingClass} text-center flex flex-col items-center justify-center h-full w-full`}
    >
      {data.showLogo && data.logo && (
        <img
          src={data.logo}
          alt="Logo"
          className={`w-auto object-contain ${logoClass}`}
          style={{ marginBottom: 'var(--item-gap)' }}
        />
      )}
      {data.showTitle && data.title && (
        <TextEl block={block} field="title" as="h1" className="font-serif text-5xl font-medium tracking-wide md:text-6xl">
          {data.title}
        </TextEl>
      )}
      {data.showTagline && data.tagline && (
        <TextEl
          block={block}
          field="tagline"
          as="p"
          className="text-sm uppercase tracking-[0.3em] opacity-90"
          style={{ marginTop: 'var(--item-gap)' }}
        >
          {data.tagline}
        </TextEl>
      )}
      {showLangSwitcher && (
        <div
          className="flex flex-wrap items-center justify-center gap-3"
          style={{ marginTop: 'var(--item-gap)' }}
        >
          {languages!.map((lang) => {
            const active = currentLanguage === lang
            return (
              <button
                key={lang}
                type="button"
                onClick={() => onLanguageChange?.(lang)}
                className={`rounded-full border px-5 py-2 text-sm font-serif tracking-wide transition-colors ${
                  active
                    ? 'border-white bg-white/15 text-white'
                    : 'border-white/60 text-white/90 hover:bg-white/10'
                }`}
                aria-pressed={active}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  // Decide whether we're in carousel mode. Header is always slide 0; promos
  // append after. With a single slide (header only) we skip all the carousel
  // chrome to keep the markup identical to pre-promo days.
  const promoSlides = promoBanner?.enabled ? (promoBanner.slides ?? []) : []
  const carouselEnabled = promoSlides.length > 0
  const allSlides = carouselEnabled
    ? [{ kind: 'header' as const, id: '__header__' }, ...promoSlides.map((s) => ({ kind: 'promo' as const, id: s.id, slide: s }))]
    : [{ kind: 'header' as const, id: '__header__' }]
  const slideCount = allSlides.length
  const [slideIndex, setSlideIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalMs = Math.max(2, promoBanner?.intervalSeconds ?? 5) * 1000
  const autoplay = promoBanner?.autoplay !== false
  const showDots = promoBanner?.showDots !== false

  useEffect(() => {
    if (!carouselEnabled || !autoplay || paused || slideCount <= 1) return
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slideCount)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [carouselEnabled, autoplay, paused, slideCount, intervalMs])

  // Keep index in range if user removes a slide while editing.
  useEffect(() => {
    if (slideIndex >= slideCount) setSlideIndex(0)
  }, [slideCount, slideIndex])

  const renderHeaderContent = () => {
    if (!carouselEnabled) {
      // Single slide: render the header card directly and keep the headerRef
      // on the actual content (its height drives sticky-nav offset).
      return <div ref={headerRef}>{headerCard}</div>
    }
    return (
      <div
        ref={headerRef}
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="overflow-hidden">
          <div
            className="flex w-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${slideIndex * 100}%)` }}
          >
            {allSlides.map((s) => (
              <div key={s.id} className="w-full shrink-0 self-stretch">
                {s.kind === 'header' ? headerCard : <PromoSlideCard slide={s.slide} />}
              </div>
            ))}
          </div>
        </div>
        {showDots && slideCount > 1 && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
            {allSlides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSlideIndex(i)}
                aria-label={`Ir al slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === slideIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderNav = (fixed = false) => (
    <div
      ref={navRef}
      className={`menu-sticky-nav border-y border-black/10 ${fixed ? 'fixed left-0 right-0 top-0 z-30' : ''}`}
      style={{ backgroundColor: navBg, color: navText }}
    >
      <div className={`mx-auto ${fixed ? 'max-w-[920px]' : ''} relative flex items-center`}>
        {searchOpen && showSearch ? (
          <div className="flex w-full items-center gap-2 px-3 py-2">
            <SearchIcon className="h-4 w-4 shrink-0 opacity-70" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar platillo…"
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeSearch()
              }}
              className="flex-1 min-w-0 bg-transparent text-sm placeholder:opacity-60 focus:outline-none"
              style={{ color: navText }}
            />
            <button
              type="button"
              onClick={closeSearch}
              aria-label="Cerrar búsqueda"
              className="rounded-full p-1.5 hover:bg-white/15"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1 overflow-x-auto">
              <ul
                ref={navListRef}
                className={`mx-auto flex w-max items-center uppercase ${navListClass}`}
              >
                {sections.length === 0 ? (
                  <li className="opacity-60 px-3 py-1.5">Añade secciones al menú</li>
                ) : (
                  sections.map((s) => {
                    const isActive = isPublicView && activeId === s.id
                    return (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          data-section-id={s.id}
                          onClick={(e) => handleNavClick(e, s.id)}
                          className={`inline-block whitespace-nowrap rounded-full transition-colors ${navItemClass} ${
                            isActive ? 'bg-white/20 font-semibold' : 'hover:bg-white/15'
                          }`}
                          aria-current={isActive ? 'true' : undefined}
                        >
                          {s.title}
                        </a>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
            {showSearch && (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar"
                className="shrink-0 rounded-full p-2 mr-2 hover:bg-white/15"
              >
                <SearchIcon className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )

  const headerPlaceholderHeight = isPublicView && stickyHeader ? headerHeight + navHeight : 0
  const navPlaceholderHeight = isPublicView && stickyNavOnly && navFixed ? navHeight : 0

  return (
    <div className="menu-header-block">
      {isPublicView && stickyHeader && <div style={{ height: headerPlaceholderHeight }} />}
      {isPublicView && stickyNavOnly && navFixed && <div style={{ height: navPlaceholderHeight }} />}
      {stickyHeader ? (
        isPublicView ? (
          <div className="fixed left-0 right-0 top-0 z-30">
            <div className="mx-auto w-full max-w-[920px]">
              {renderHeaderContent()}
              {renderNav(false)}
            </div>
          </div>
        ) : (
          <div className="sticky top-0 z-30">
            {renderHeaderContent()}
            {renderNav(false)}
          </div>
        )
      ) : (
        <>
          {renderHeaderContent()}
          {renderNav(isPublicView && stickyNavOnly && navFixed)}
        </>
      )}
    </div>
  )
}
