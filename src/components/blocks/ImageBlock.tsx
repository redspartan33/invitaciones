import type { CSSProperties } from 'react'
import type { InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'

/** A free-form image / sticker / PNG element. */
export function ImageBlock({ block, free }: { block: InvitationBlock<'image'>; free?: boolean }) {
  const d = block.data
  const radius = d.radius ? `${d.radius}px` : undefined
  const opacity = (d.opacity ?? 100) / 100

  if (!d.url) {
    const placeholder = (
      <div
        className="flex h-full w-full items-center justify-center bg-black/5 text-xs text-ink-400"
        style={{ borderRadius: radius, minHeight: free ? undefined : 160 }}
      >
        Sin imagen
      </div>
    )
    return free ? placeholder : <BlockWrapper style={block.style}>{placeholder}</BlockWrapper>
  }

  const imgStyle: CSSProperties = {
    width: '100%',
    height: free ? '100%' : 'auto',
    objectFit: d.fit ?? 'cover',
    borderRadius: radius,
    opacity,
    display: 'block',
  }
  const img = <img src={d.url} alt={d.alt || ''} style={imgStyle} draggable={false} />

  if (free) return img
  return (
    <BlockWrapper style={block.style}>
      <div className="mx-auto max-w-full">{img}</div>
    </BlockWrapper>
  )
}
