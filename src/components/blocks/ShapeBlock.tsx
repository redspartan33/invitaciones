import type { CSSProperties, ReactElement } from 'react'
import type { InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'

/** A free-form vector shape: rectangle, ellipse or line. */
export function ShapeBlock({ block, free }: { block: InvitationBlock<'shape'>; free?: boolean }) {
  const d = block.data
  const opacity = (d.opacity ?? 100) / 100

  let el: ReactElement
  if (d.shape === 'line') {
    const lineStyle: CSSProperties = {
      width: '100%',
      height: `${d.strokeWidth || 2}px`,
      background: d.stroke || d.fill || '#000000',
      opacity,
    }
    el = <div style={lineStyle} />
  } else {
    const boxStyle: CSSProperties = {
      width: '100%',
      height: '100%',
      background: d.fill || 'transparent',
      border: d.strokeWidth ? `${d.strokeWidth}px solid ${d.stroke || '#000000'}` : undefined,
      borderRadius: d.shape === 'ellipse' ? '9999px' : d.radius ? `${d.radius}px` : undefined,
      opacity,
    }
    el = <div style={boxStyle} />
  }

  if (free) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        {el}
      </div>
    )
  }
  // Stacked flow: give the shape a default height so it's visible inline.
  return (
    <BlockWrapper style={block.style}>
      <div style={{ height: d.shape === 'line' ? undefined : 120 }}>{el}</div>
    </BlockWrapper>
  )
}
