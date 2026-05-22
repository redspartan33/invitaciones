import type { GiftRegistryData, InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'

export function GiftRegistryBlock({ block }: { block: InvitationBlock<'gift-registry'> }) {
  const data = block.data as GiftRegistryData
  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        {data.title && <h2 className="font-serif text-3xl">{data.title}</h2>}
        {data.message && <p className="mx-auto mt-3 max-w-md text-sm opacity-80">{data.message}</p>}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.items.map((item) => (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between border accent-border bg-white/50 px-4 py-4 transition-colors hover:primary-bg"
          >
            <div className="text-left">
              <p className="font-medium">{item.storeName}</p>
              {item.description && <p className="text-xs opacity-70">{item.description}</p>}
            </div>
            <span className="accent text-xs uppercase tracking-widest">Abrir →</span>
          </a>
        ))}
      </div>
    </BlockWrapper>
  )
}
