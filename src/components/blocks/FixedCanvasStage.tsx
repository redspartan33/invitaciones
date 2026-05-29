import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref } from 'react'
import { CANVAS_ASPECTS, CANVAS_DESIGN_WIDTH, type CanvasAspect } from '../../types/invitation.types'

/**
 * Renders a fixed-proportion "card" at a logical design width and uniformly
 * scales it to fit the available space. Everything inside is authored at the
 * design resolution (CANVAS_DESIGN_WIDTH px wide) so px-based sizes (font
 * size, radius, stroke) and percentage positions scale together and look
 * identical on any screen.
 *
 *  - fit='width'   : scale so the card fills the parent width (public view).
 *  - fit='contain' : scale so the whole card is visible (editor viewport).
 */
export function FixedCanvasStage({
  aspect,
  fit,
  background,
  children,
  stageRef,
  onStagePointerDown,
  maxScale,
}: {
  aspect: CanvasAspect
  fit: 'width' | 'contain'
  background?: string
  children: ReactNode
  stageRef?: Ref<HTMLDivElement>
  onStagePointerDown?: (e: React.PointerEvent) => void
  /** Cap the scale so the card never renders larger than its design size. */
  maxScale?: number
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ratio = CANVAS_ASPECTS[aspect]?.ratio ?? CANVAS_ASPECTS['4:5'].ratio
  const designW = CANVAS_DESIGN_WIDTH
  const designH = Math.round(designW / ratio)

  let scale = size.w > 0 ? size.w / designW : 0
  if (fit === 'contain' && size.h > 0) {
    scale = Math.min(size.w / designW, size.h / designH)
  }
  if (maxScale) scale = Math.min(scale, maxScale)

  const stageW = designW * scale
  const stageH = designH * scale

  const wrapStyle: CSSProperties = {
    width: '100%',
    height: fit === 'contain' ? '100%' : undefined,
    display: 'flex',
    justifyContent: 'center',
    alignItems: fit === 'contain' ? 'center' : 'flex-start',
  }

  const stageStyle: CSSProperties = {
    width: designW,
    height: designH,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    position: 'absolute',
    top: 0,
    left: 0,
    background,
    overflow: 'hidden',
  }

  return (
    <div ref={wrapRef} style={wrapStyle}>
      {scale > 0 && (
        <div style={{ width: stageW, height: stageH, position: 'relative' }}>
          <div
            ref={stageRef}
            data-canvas-stage=""
            style={stageStyle}
            onPointerDown={onStagePointerDown}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
