import type { GiftRegistryData, InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export function GiftRegistryBlock({ block }: { block: InvitationBlock<'gift-registry'> }) {
  const data = block.data as GiftRegistryData
  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        {data.title && (
          <TextEl block={block} field="title" as="h2" className="font-serif text-3xl">
            {data.title}
          </TextEl>
        )}
        {data.message && (
          <TextEl block={block} field="message" as="p" className="mx-auto mt-3 max-w-md text-sm opacity-80">
            {data.message}
          </TextEl>
        )}
      </div>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--item-gap)' }}>
        {data.items.map((item) => (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between border accent-border bg-white/50 px-4 py-4 transition-colors hover:primary-bg"
          >
            <div className="text-left">
              <TextEl block={block} field="items.storeName" as="p" className="font-medium">
                {item.storeName}
              </TextEl>
              {item.description && (
                <TextEl block={block} field="items.description" as="p" className="text-xs opacity-70">
                  {item.description}
                </TextEl>
              )}
            </div>
            <span className="accent text-xs uppercase tracking-widest">Abrir →</span>
          </a>
        ))}
      </div>
    </BlockWrapper>
  )
}
