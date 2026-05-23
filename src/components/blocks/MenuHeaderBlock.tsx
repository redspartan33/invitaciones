import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { InvitationBlock, MenuHeaderData, MenuSectionData } from '../../types/invitation.types'
import { useEditorStore } from '../../store/editorStore'
import { TextEl } from './TextEl'
import { menuSectionAnchor } from '../../utils/menuNav'

interface Props {
  block: InvitationBlock<'menu-header'>
  /** When rendered standalone (e.g. public view) we read sections from props. */
  sectionsOverride?: { id: string; title: string }[]
  publicView?: boolean
}

export function MenuHeaderBlock({ block, sectionsOverride, publicView }: Props) {
  const data = block.data as MenuHeaderData
  const sectionsFromStore = useEditorStore((s) =>
    s.invitation.kind === 'menu'
      ? s.invitation.blocks
          .filter((b) => b.type === 'menu-section' && b.visible)
          .sort((a, b) => a.order - b.order)
          .map((b) => ({
            id: menuSectionAnchor(b.id, (b.data as MenuSectionData).title),
            title: (b.data as MenuSectionData).title || 'Sección',
          }))
      : [],
  )
  const sections = sectionsOverride ?? sectionsFromStore
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

  const stickyHeader = !!data.stickyHeader
  const stickyNavOnly = !stickyHeader && !!data.stickyNavOnly
  const isPublicView = publicView ?? sectionsOverride !== undefined

  const headerRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLDivElement | null>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [navHeight, setNavHeight] = useState(0)
  const [navFixed, setNavFixed] = useState(false)

  useLayoutEffect(() => {
    const headerEl = headerRef.current
    const navEl = navRef.current
    if (!headerEl || !navEl) return
    setHeaderHeight(headerEl.offsetHeight)
    setNavHeight(navEl.offsetHeight)
  }, [data.title, data.tagline, data.backgroundImage, data.showLogo, data.showTitle, data.showTagline, sections.length])

  useEffect(() => {
    if (!isPublicView || !stickyNavOnly) return undefined
    const update = () => {
      setNavFixed(window.scrollY >= headerHeight)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [headerHeight, isPublicView, stickyNavOnly])

  const renderHeaderContent = () => (
    <div style={bgStyle} className="px-6 py-16 text-center" ref={headerRef}>
      {data.showLogo && data.logo && (
        <img src={data.logo} alt="Logo" className="mx-auto mb-4 h-16 w-auto object-contain" />
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
    </div>
  )

  const renderNav = (fixed = false) => (
    <div
      ref={navRef}
      className={`menu-sticky-nav border-y border-black/10 ${fixed ? 'fixed left-0 right-0 top-0 z-30' : 'overflow-x-auto'}`}
      style={{ backgroundColor: navBg, color: navText }}
    >
      <div className={`mx-auto ${fixed ? 'max-w-[920px]' : ''} overflow-x-auto`}>
        <ul className="mx-auto flex w-max items-center gap-1 px-4 py-2.5 text-[12px] uppercase tracking-[0.18em]">
          {sections.length === 0 ? (
            <li className="opacity-60 px-3 py-1.5">Añade secciones al menú</li>
          ) : (
            sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="inline-block whitespace-nowrap rounded-full px-3 py-1.5 transition-colors hover:bg-white/15"
                >
                  {s.title}
                </a>
              </li>
            ))
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
