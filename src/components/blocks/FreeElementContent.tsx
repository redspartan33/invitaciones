import type { InvitationBlock } from '../../types/invitation.types'
import { BlockRenderer } from './BlockRenderer'
import { TextBlock } from './TextBlock'
import { ImageBlock } from './ImageBlock'
import { ShapeBlock } from './ShapeBlock'

/**
 * Renders a block's content to fill its positioned box on a fixed canvas.
 * Bare elements (text/image/shape) render edge-to-edge; rich blocks reuse the
 * normal BlockRenderer so they look identical to the stacked view.
 */
export function FreeElementContent({ block }: { block: InvitationBlock }) {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block as InvitationBlock<'text'>} free />
    case 'image':
      return <ImageBlock block={block as InvitationBlock<'image'>} free />
    case 'shape':
      return <ShapeBlock block={block as InvitationBlock<'shape'>} free />
    default:
      return (
        <div className="h-full w-full overflow-auto">
          <BlockRenderer block={block} />
        </div>
      )
  }
}
