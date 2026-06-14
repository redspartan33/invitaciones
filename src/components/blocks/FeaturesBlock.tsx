import type { FeaturesData, InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export function FeaturesBlock({ block }: { block: InvitationBlock<'features'> }) {
  const data = block.data as FeaturesData
  return (
    <BlockWrapper style={block.style}>
      {data.title && (
        <TextEl block={block} field="title" as="h2" className="text-center font-serif text-3xl">
          {data.title}
        </TextEl>
      )}
      <div className="mt-8 flex flex-col" style={{ gap: 'var(--item-gap)' }}>
        {data.items.map((item) => (
          <div
            key={item.id}
            className="flex items-baseline justify-between gap-4 border-b accent-border pb-3"
          >
            <div className="flex items-baseline gap-2 text-left">
              {!block.style?.hideIcons && <span className="accent">✓</span>}
              <TextEl block={block} field="items.label" as="span" className="font-medium">
                {item.label}
              </TextEl>
            </div>
            {item.value && (
              <TextEl block={block} field="items.value" as="span" className="text-right opacity-80">
                {item.value}
              </TextEl>
            )}
          </div>
        ))}
      </div>
    </BlockWrapper>
  )
}
