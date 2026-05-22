import type { GiftRegistryData, InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'

export function GiftRegistryBlock({ block }: { block: InvitationBlock<'gift-registry'> }) {
  const data = block.data as GiftRegistryData
  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        <h2 className="font-serif text-3xl">{data.title}</h2>
        {data.message && <p className="mx-auto mt-3 max-w-md text-sm text-ink-600">{data.message}</p>}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.items.map((item) => (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between border border-ink-200 bg-white px-4 py-4 transition-colors hover:border-ink-900"
          >
            <div className="text-left">
              <p className="font-medium text-ink-900">{item.storeName}</p>
              {item.description && <p className="text-xs text-ink-500">{item.description}</p>}
            </div>
            <span className="text-xs uppercase tracking-widest text-ink-500">Abrir →</span>
          </a>
        ))}
      </div>
    </BlockWrapper>
  )
}
