import type { InvitationBlock, MenuSectionData } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'
import { menuSectionAnchor } from '../../utils/menuNav'

export function MenuSectionBlock({ block }: { block: InvitationBlock<'menu-section'> }) {
  const data = block.data as MenuSectionData
  const anchor = menuSectionAnchor(block.id, data.title, data.customAnchor)
  // style.itemSpacing is the universal control; data.itemSpacing is the legacy
  // value kept for backwards compatibility with already-saved menus.
  // BlockWrapper exposes the chosen spacing as the `--item-gap` CSS variable,
  // but menu-section needs to honor the legacy data field too, so we fall back
  // to inline space-y when style.itemSpacing isn't set yet.
  const styleHasSpacing = !!block.style?.itemSpacing
  const legacyClass = !styleHasSpacing && data.itemSpacing
    ? {
        xs: 'space-y-1',
        sm: 'space-y-2',
        md: 'space-y-4',
        lg: 'space-y-6',
        xl: 'space-y-8',
      }[data.itemSpacing]
    : ''

  return (
    <div id={anchor} className="scroll-mt-24">
      <BlockWrapper style={block.style} align="left">
        <div className="mx-auto max-w-2xl">
          <header className="mb-6 border-b border-current/20 pb-3">
            <TextEl
              block={block}
              field="title"
              as="h2"
              className="font-serif text-3xl font-medium tracking-wide accent"
            >
              {data.title || 'Sección'}
            </TextEl>
            {data.description && (
              <TextEl
                block={block}
                field="description"
                as="p"
                className="mt-1.5 text-sm italic opacity-70"
              >
                {data.description}
              </TextEl>
            )}
          </header>
          <ul
            className={legacyClass}
            style={styleHasSpacing ? { display: 'flex', flexDirection: 'column', gap: 'var(--item-gap)' } : undefined}
          >
            {data.items.map((item) => (
              <li key={item.id} className="grid grid-cols-[1fr_auto] gap-x-4">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-base">{item.name}</span>
                    {item.badges && (
                      <span className="text-[10px] uppercase tracking-widest opacity-60">
                        {item.badges}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-0.5 text-sm italic opacity-70">{item.description}</p>
                  )}
                </div>
                {item.price && (
                  <span className="whitespace-nowrap font-medium text-base tabular-nums accent">
                    {item.price}
                  </span>
                )}
              </li>
            ))}
            {data.items.length === 0 && (
              <li className="text-sm italic opacity-50">Aún no hay platillos en esta sección.</li>
            )}
          </ul>
        </div>
      </BlockWrapper>
    </div>
  )
}
