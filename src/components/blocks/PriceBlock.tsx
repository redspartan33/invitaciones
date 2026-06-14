import type { InvitationBlock, PriceData } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export function PriceBlock({ block }: { block: InvitationBlock<'price'> }) {
  const data = block.data as PriceData
  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        {data.badge && (
          <TextEl
            block={block}
            field="badge"
            as="span"
            className="accent-bg inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
          >
            {data.badge}
          </TextEl>
        )}
        {data.label && (
          <TextEl block={block} field="label" as="p" className="mt-4 text-sm uppercase tracking-widest opacity-70">
            {data.label}
          </TextEl>
        )}
        <div className="mt-1 flex items-baseline justify-center gap-3">
          {data.price && (
            <TextEl block={block} field="price" as="span" className="font-serif text-5xl">
              {data.price}
            </TextEl>
          )}
          {data.compareAtPrice && (
            <TextEl block={block} field="compareAtPrice" as="span" className="text-2xl line-through opacity-50">
              {data.compareAtPrice}
            </TextEl>
          )}
        </div>
        {data.note && (
          <TextEl block={block} field="note" as="p" className="mt-3 text-sm opacity-70">
            {data.note}
          </TextEl>
        )}
      </div>
    </BlockWrapper>
  )
}
