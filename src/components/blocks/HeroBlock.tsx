import type { HeroData, InvitationBlock } from '../../types/invitation.types'
import { formatDate } from '../../utils/blockValidation'
import { BlockWrapper } from './BlockWrapper'

export function HeroBlock({ block }: { block: InvitationBlock<'hero'> }) {
  const data = block.data as HeroData
  const align = data.alignment ?? 'center'
  const usingImage = !!data.backgroundImage
  const bg = usingImage
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${data.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
      }
    : data.backgroundColor
    ? { backgroundColor: data.backgroundColor }
    : {}

  return (
    <div
      className="px-8 py-32"
      style={{ ...bg, textAlign: align }}
    >
      <div className="mx-auto max-w-2xl">
        {data.showSubtitle && data.subtitle && (
          <p className={`mb-6 text-sm uppercase tracking-[0.3em] ${usingImage ? 'opacity-90' : 'accent'}`}>{data.subtitle}</p>
        )}
        {data.showTitle && data.title && (
          <h1 className="font-serif text-6xl font-medium leading-tight md:text-7xl">{data.title}</h1>
        )}
        {data.showDate && data.eventDate && (
          <p className={`mt-8 text-sm uppercase tracking-[0.3em] ${usingImage ? 'opacity-90' : ''}`}>
            {formatDate(data.eventDate, data.dateFormat)}
          </p>
        )}
      </div>
    </div>
  )
}

export { BlockWrapper }
