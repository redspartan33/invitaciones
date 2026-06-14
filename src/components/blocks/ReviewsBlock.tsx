import type { InvitationBlock, ReviewsData } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className="accent text-sm tracking-widest" aria-label={`${r} de 5`}>
      {'★'.repeat(r)}
      <span className="opacity-30">{'★'.repeat(5 - r)}</span>
    </span>
  )
}

export function ReviewsBlock({ block }: { block: InvitationBlock<'reviews'> }) {
  const data = block.data as ReviewsData
  return (
    <BlockWrapper style={block.style}>
      {data.title && (
        <TextEl block={block} field="title" as="h2" className="text-center font-serif text-3xl">
          {data.title}
        </TextEl>
      )}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--item-gap)' }}>
        {data.items.map((item) => (
          <figure key={item.id} className="flex flex-col gap-3 border accent-border bg-white/50 px-5 py-5 text-left">
            {typeof item.rating === 'number' && <Stars rating={item.rating} />}
            {item.quote && (
              <TextEl block={block} field="items.quote" as="blockquote" className="text-sm leading-relaxed">
                “{item.quote}”
              </TextEl>
            )}
            <figcaption className="mt-auto flex items-center gap-3 pt-2">
              {item.avatar && (
                <img src={item.avatar} alt={item.author} className="h-9 w-9 rounded-full object-cover" />
              )}
              <TextEl block={block} field="items.author" as="span" className="text-sm font-medium">
                {item.author}
              </TextEl>
            </figcaption>
          </figure>
        ))}
      </div>
    </BlockWrapper>
  )
}
