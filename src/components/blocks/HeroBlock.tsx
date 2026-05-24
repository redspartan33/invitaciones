import type { HeroData, InvitationBlock } from '../../types/invitation.types'
import { formatDate } from '../../utils/blockValidation'
import { resolveFieldOrder } from '../../utils/fieldOrder'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export const HERO_FIELD_ORDER = ['subtitle', 'title', 'eventDate'] as const

export function HeroBlock({ block }: { block: InvitationBlock<'hero'> }) {
  const data = block.data as HeroData
  const align = data.alignment ?? 'center'
  const usingImage = !!data.backgroundImage
  // Render the bg image as-is: no dark overlay, no forced text color. If
  // the resulting contrast is too low the user can pick text color per
  // element via the per-text Color picker in the sidebar.
  const bgStyle = usingImage
    ? {
        backgroundImage: `url(${data.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : data.backgroundColor
    ? { backgroundColor: data.backgroundColor }
    : undefined

  const order = resolveFieldOrder([...HERO_FIELD_ORDER], block.style?.fieldOrder)

  const renderField = (field: string) => {
    switch (field) {
      case 'subtitle':
        return data.showSubtitle && data.subtitle ? (
          <TextEl
            key="subtitle"
            block={block}
            field="subtitle"
            as="p"
            className="accent text-sm uppercase tracking-[0.3em]"
          >
            {data.subtitle}
          </TextEl>
        ) : null
      case 'title':
        return data.showTitle && data.title ? (
          <TextEl
            key="title"
            block={block}
            field="title"
            as="h1"
            className="font-serif text-6xl font-medium leading-tight md:text-7xl"
          >
            {data.title}
          </TextEl>
        ) : null
      case 'eventDate':
        return data.showDate && data.eventDate ? (
          <TextEl
            key="eventDate"
            block={block}
            field="eventDate"
            as="p"
            className="text-sm uppercase tracking-[0.3em]"
          >
            {formatDate(data.eventDate, data.dateFormat)}
          </TextEl>
        ) : null
      default:
        return null
    }
  }

  return (
    <div style={bgStyle}>
      <BlockWrapper style={block.style} align={align}>
        <div className="flex flex-col items-stretch" style={{ gap: 'var(--item-gap)' }}>
          {order.map((f) => renderField(f))}
        </div>
      </BlockWrapper>
    </div>
  )
}

export { BlockWrapper }
