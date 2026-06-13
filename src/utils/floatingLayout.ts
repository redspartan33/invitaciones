import type { CSSProperties } from 'react'
import type { FloatingData, InvitationBlock } from '../types/invitation.types'

/** A floating block is one anchored to a screen corner (fixed) when its
 *  anchorMode is 'screen', otherwise it floats freely over the invitation. */
export function isScreenAnchored(block: InvitationBlock<'floating'>): boolean {
  return (block.data as FloatingData).anchorMode === 'screen'
}

/** Margin (px) between a screen-anchored floating block and the viewport edge. */
const SCREEN_MARGIN = 16

const SHADOW_PRESETS: Record<'soft' | 'medium' | 'strong', string> = {
  soft: 'drop-shadow(0 4px 8px rgba(0,0,0,0.18))',
  medium: 'drop-shadow(0 10px 22px rgba(0,0,0,0.28))',
  strong: 'drop-shadow(0 20px 38px rgba(0,0,0,0.42))',
}

/** Convert a hex color + 0–1 alpha to an `rgba()` string. */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '').trim()
  const expanded =
    clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0').slice(0, 6)
  const num = parseInt(expanded, 16)
  if (Number.isNaN(num)) return `rgba(0,0,0,${alpha})`
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * CSS `filter` value for a floating block's optional drop-shadow, or undefined
 * when no shadow is set. Uses `drop-shadow()` so the shadow traces the alpha
 * contour of transparent stickers instead of a bounding box.
 */
export function floatingShadowFilter(d: FloatingData): string | undefined {
  const s = d.shadow ?? 'none'
  if (s === 'none') return undefined
  if (s === 'custom') {
    const x = d.shadowX ?? 0
    const y = d.shadowY ?? 8
    const blur = d.shadowBlur ?? 18
    const color = hexToRgba(d.shadowColor ?? '#000000', (d.shadowOpacity ?? 30) / 100)
    return `drop-shadow(${x}px ${y}px ${blur}px ${color})`
  }
  return SHADOW_PRESETS[s]
}

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
