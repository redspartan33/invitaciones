import type { GalleryData, InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export function GalleryBlock({ block }: { block: InvitationBlock<'gallery'> }) {
  const data = block.data as GalleryData
  const cols = { 2: 'grid-cols-2', 3: 'grid-cols-2 md:grid-cols-3', 4: 'grid-cols-2 md:grid-cols-4' }[data.columns]
  return (
    <BlockWrapper style={block.style}>
      {data.title && (
        <div className="mb-8 text-center">
          <TextEl block={block} field="title" as="h2" className="font-serif text-3xl">
            {data.title}
          </TextEl>
        </div>
      )}
      <div className={`grid ${cols} gap-2`}>
        {data.images.map((img) => (
          <div key={img.id} className="aspect-square overflow-hidden border accent-border bg-black/5">
            <img src={img.url} alt={img.caption ?? ''} className="block h-full w-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    </BlockWrapper>
  )
}
