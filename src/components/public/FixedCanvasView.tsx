import type { CSSProperties } from 'react'
import type { Invitation } from '../../types/invitation.types'
import { FixedCanvasStage } from '../blocks/FixedCanvasStage'
import { FreeElementContent } from '../blocks/FreeElementContent'
import { defaultLayoutFor } from '../../utils/blockDefaults'

/** Public renderer for a fixed-canvas invitation: the authored card scaled to
 *  fill the available width, identical on every screen. */
export function FixedCanvasView({ invitation }: { invitation: Invitation }) {
  const { globalSettings } = invitation
  const aspect = invitation.canvasAspect ?? '4:5'
  const blocks = [...invitation.blocks]
    .filter((b) => b.visible)
    .sort((a, b) => (a.layout?.zIndex ?? 0) - (b.layout?.zIndex ?? 0))

  return (
    <div className="mx-auto w-full" style={{ maxWidth: 540 }}>
      <FixedCanvasStage aspect={aspect} fit="width" background={globalSettings.colorSecondary || '#ffffff'}>
        {blocks.map((block) => {
          const l = block.layout ?? defaultLayoutFor(block.type)
          const style: CSSProperties = {
            position: 'absolute',
            left: `${l.xPct}%`,
            top: `${l.yPct}%`,
            width: `${l.wPct}%`,
            height: `${l.hPct}%`,
            transform: `rotate(${l.rotation ?? 0}deg)`,
            transformOrigin: 'center center',
            zIndex: l.zIndex ?? 0,
          }
          return (
            <div key={block.id} style={style}>
              <FreeElementContent block={block} />
            </div>
          )
        })}
      </FixedCanvasStage>
    </div>
  )
}
