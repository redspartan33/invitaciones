import type { HeroData, InvitationBlock } from '../../types/invitation.types'
import { formatDate } from '../../utils/blockValidation'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export function HeroBlock({ block }: { block: InvitationBlock<'hero'> }) {
  const data = block.data as HeroData
  const align = data.alignment ?? 'center'
  const usingImage = !!data.backgroundImage
  const bgStyle = usingImage
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${data.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
      }
    : data.backgroundColor
    ? { backgroundColor: data.backgroundColor }
    : undefined

  return (
    <div style={bgStyle}>
      <BlockWrapper style={block.style} align={align}>
        {data.showSubtitle && data.subtitle && (
          <TextEl
            block={block}
            field="subtitle"
            as="p"
            className={`mb-6 text-sm uppercase tracking-[0.3em] ${usingImage ? 'opacity-90' : 'accent'}`}
          >
            {data.subtitle}
          </TextEl>
        )}
        {data.showTitle && data.title && (
          <TextEl block={block} field="title" as="h1" className="font-serif text-6xl font-medium leading-tight md:text-7xl">
            {data.title}
          </TextEl>
        )}
        {data.showDate && data.eventDate && (
          <TextEl
            block={block}
            field="eventDate"
            as="p"
            className={`mt-8 text-sm uppercase tracking-[0.3em] ${usingImage ? 'opacity-90' : ''}`}
          >
            {formatDate(data.eventDate, data.dateFormat)}
          </TextEl>
        )}
      </BlockWrapper>
    </div>
  )
}

export { BlockWrapper }
