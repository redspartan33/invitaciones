import type { InvitationBlock, MenuHeaderData, MenuSectionData } from '../../types/invitation.types'
import { useEditorStore } from '../../store/editorStore'
import { TextEl } from './TextEl'
import { menuSectionAnchor } from '../../utils/menuNav'

interface Props {
  block: InvitationBlock<'menu-header'>
  /** When rendered standalone (e.g. public view) we read sections from props. */
  sectionsOverride?: { id: string; title: string }[]
}

export function MenuHeaderBlock({ block, sectionsOverride }: Props) {
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

  return (
    <div className="menu-header-block">
      {stickyHeader ? (
        <div className="sticky top-0 z-30">
          <div style={bgStyle} className="px-6 py-16 text-center">
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
          <nav
            className="menu-sticky-nav overflow-x-auto border-y border-black/10"
            style={{ backgroundColor: navBg, color: navText }}
          >
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
          </nav>
        </div>
      ) : (
        <>
          <div style={bgStyle} className="px-6 py-16 text-center">
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
          <nav
            className={`menu-sticky-nav ${stickyNavOnly ? 'sticky top-0 z-30' : ''} overflow-x-auto border-y border-black/10`}
            style={{ backgroundColor: navBg, color: navText }}
          >
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
          </nav>
        </>
      )}
    </div>
  )
}
