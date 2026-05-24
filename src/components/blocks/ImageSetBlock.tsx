import type { ImageSetData, InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

const ASPECT_CLASS: Record<NonNullable<ImageSetData['aspect']>, string> = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
  auto: '',
}

export function ImageSetBlock({ block }: { block: InvitationBlock<'image-set'> }) {
  const data = block.data as ImageSetData
  const images = (data.images ?? []).slice(0, 3).filter((i) => i.url)
  const count = images.length
  const aspectCls = ASPECT_CLASS[data.aspect ?? 'square']

  // Grid: 1 image -> centered single column, 2 -> 2 cols, 3 -> 3 cols.
  // Rule applies on both mobile and desktop per spec.
  const gridCols =
    count === 3 ? 'grid-cols-3' : count === 2 ? 'grid-cols-2' : 'grid-cols-1'

  return (
    <BlockWrapper style={block.style}>
      {data.title && (
        <div className="mb-6 text-center">
          <TextEl block={block} field="title" as="h2" className="font-serif text-3xl">
            {data.title}
          </TextEl>
        </div>
      )}

      {count === 0 ? (
        <div className="mx-auto flex h-40 w-full max-w-sm items-center justify-center rounded border border-dashed border-ink-300 text-xs text-ink-400">
          Añade hasta 3 imágenes
        </div>
      ) : (
        <div
          className={`grid ${gridCols} ${count === 1 ? 'mx-auto max-w-md' : ''}`}
          style={{ gap: 'var(--item-gap)' }}
        >
          {images.map((img) => (
            <figure key={img.id} className="m-0">
              <div className={`overflow-hidden border accent-border bg-black/5 ${aspectCls}`}>
                <img
                  src={img.url}
                  alt={img.caption ?? ''}
                  className="block h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              {img.caption && (
                <figcaption className="mt-1.5 text-center text-xs text-ink-500">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </BlockWrapper>
  )
}
