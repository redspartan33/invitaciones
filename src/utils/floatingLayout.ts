import type { CSSProperties } from 'react'
import type { FloatingData, InvitationBlock } from '../types/invitation.types'

/** A floating block is one anchored to a screen corner (fixed) when its
 *  anchorMode is 'screen', otherwise it floats freely over the invitation. */
export function isScreenAnchored(block: InvitationBlock<'floating'>): boolean {
  return (block.data as FloatingData).anchorMode === 'screen'
}

/** Margin (px) between a screen-anchored floating block and the viewport edge. */
const SCREEN_MARGIN = 16

/**
 * Positioning CSS for a floating block that floats over the invitation column
 * (anchorMode 'canvas'). Percentages resolve against the column box, so the
 * element scrolls with the content and scales with the layout. Used by both
 * the public view and the editor (the editor adds drag handlers on top).
 */
export function canvasFloatStyle(block: InvitationBlock<'floating'>): CSSProperties {
  const l = block.layout
  const rotation = l?.rotation ?? 0
  return {
    position: 'absolute',
    left: `${l?.xPct ?? 36}%`,
    top: `${l?.yPct ?? 8}%`,
    width: `${l?.wPct ?? 28}%`,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    zIndex: l?.zIndex ?? 5,
  }
}

/**
 * Positioning CSS for a screen-anchored floating block. `position` is left to
 * the caller: 'fixed' in the public view (pins to the viewport), 'absolute' in
 * the editor (pins inside the device frame).
 */
export function screenFloatStyle(
  block: InvitationBlock<'floating'>,
  position: 'fixed' | 'absolute',
): CSSProperties {
  const d = block.data as FloatingData
  const corner = d.screenCorner ?? 'bottom-right'
  const width = d.screenWidth ?? 160
  const [v, h] = corner.split('-') as ['top' | 'bottom', 'left' | 'center' | 'right']
  const css: CSSProperties = {
    position,
    width,
    zIndex: block.layout?.zIndex ?? 50,
  }
  if (v === 'top') css.top = SCREEN_MARGIN
  else css.bottom = SCREEN_MARGIN
  if (h === 'left') css.left = SCREEN_MARGIN
  else if (h === 'right') css.right = SCREEN_MARGIN
  else {
    css.left = '50%'
    css.transform = 'translateX(-50%)'
  }
  return css
}
