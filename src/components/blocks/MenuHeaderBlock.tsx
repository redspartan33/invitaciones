import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import type {
  InvitationBlock,
  Language,
  MenuHeaderData,
  MenuSectionData,
} from '../../types/invitation.types'
import { useEditorStore } from '../../store/editorStore'
import { TextEl } from './TextEl'
import { menuSectionAnchor } from '../../utils/menuNav'
import { LANGUAGE_LABELS } from '../../utils/translation'

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
  const usingImage = !!data.backgroundImage
  const bgStyle = usingImage
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${data.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
      }
    : data.backgroundColor
    ? { backgroundColor: data.backgroundColor, color: '#fff' }
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
  }, [data.title, data.tagline, data.backgroundImage, data.showLogo, data.showTitle, data.showTagline, navSize, logoSize, sections.length])

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

  const renderHeaderContent = () => (
    <div style={bgStyle} className="px-6 py-16 text-center" ref={headerRef}>
      {data.showLogo && data.logo && (
        <img src={data.logo} alt="Logo" className={`mx-auto mb-4 w-auto object-contain ${logoClass}`} />
      )}
      {data.showTitle && data.title && (
        <TextEl block={block} field="title" as="h1" className="font-serif text-5xl font-medium tracking-wide md:text-6xl">
          {data.title}
        </TextEl>
      )}
      {data.showTagline && data.tagline && (
        <TextEl block={block} field="tagline" as="p" className="mt-3 text-sm uppercase tracking-[0.3em] opacity-90">
          {data.tagline}
        </TextEl>
      )}
      {showLangSwitcher && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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

  const renderNav = (fixed = false) => (
    <div
      ref={navRef}
      className={`menu-sticky-nav border-y border-black/10 ${fixed ? 'fixed left-0 right-0 top-0 z-30' : 'overflow-x-auto'}`}
      style={{ backgroundColor: navBg, color: navText }}
    >
      <div className={`mx-auto ${fixed ? 'max-w-[920px]' : ''} overflow-x-auto`}>
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
