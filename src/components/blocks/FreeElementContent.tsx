import type { InvitationBlock } from '../../types/invitation.types'
import { BlockRenderer } from './BlockRenderer'
import { TextBlock } from './TextBlock'
import { ImageBlock } from './ImageBlock'
import { ShapeBlock } from './ShapeBlock'
import { FloatingBlock } from './FloatingBlock'
import { MotionLoop } from './MotionLoop'

/**
 * Renders a block's content to fill its positioned box on a fixed canvas.
 * Bare elements (text/image/shape) render edge-to-edge; rich blocks reuse the
 * normal BlockRenderer so they look identical to the stacked view.
 */
export function FreeElementContent({ block }: { block: InvitationBlock }) {
  switch (block.type) {
    // text/image/shape render bare here, so we add the looping motion wrapper.
    // floating self-wraps in MotionLoop, and the default path goes through
    // BlockRenderer which already applies the loop.
    case 'text':
      return (
        <MotionLoop style={block.style}>
          <TextBlock block={block as InvitationBlock<'text'>} free />
        </MotionLoop>
      )
    case 'image':
      return (
        <MotionLoop style={block.style}>
          <ImageBlock block={block as InvitationBlock<'image'>} free />
        </MotionLoop>
      )
    case 'shape':
      return (
        <MotionLoop style={block.style}>
          <ShapeBlock block={block as InvitationBlock<'shape'>} free />
        </MotionLoop>
      )
    case 'floating':
      return <FloatingBlock block={block as InvitationBlock<'floating'>} />
    default:
      return (
        <div className="h-full w-full overflow-auto">
          <BlockRenderer block={block} />
        </div>
      )
  }
}
