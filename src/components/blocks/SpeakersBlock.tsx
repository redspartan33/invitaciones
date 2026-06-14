import type { InvitationBlock, SpeakersData } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export function SpeakersBlock({ block }: { block: InvitationBlock<'speakers'> }) {
  const data = block.data as SpeakersData
  const cols = data.columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
  return (
    <BlockWrapper style={block.style}>
      {data.title && (
        <TextEl block={block} field="title" as="h2" className="text-center font-serif text-3xl">
          {data.title}
        </TextEl>
      )}
      <div className={`mt-8 grid grid-cols-1 ${cols}`} style={{ gap: 'var(--item-gap)' }}>
        {data.items.map((item) => (
          <div key={item.id} className="flex flex-col items-center text-center">
            <div className="aspect-square w-full overflow-hidden rounded-2xl border accent-border bg-white/40">
              {item.photo ? (
                <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center accent text-4xl opacity-40">☺</div>
              )}
            </div>
            <TextEl block={block} field="items.name" as="p" className="mt-3 font-medium">
              {item.name}
            </TextEl>
            {item.role && (
              <TextEl block={block} field="items.role" as="p" className="accent text-xs uppercase tracking-widest">
                {item.role}
              </TextEl>
            )}
            {item.bio && (
              <TextEl block={block} field="items.bio" as="p" className="mt-2 text-xs opacity-70">
                {item.bio}
              </TextEl>
            )}
          </div>
        ))}
      </div>
    </BlockWrapper>
  )
}
