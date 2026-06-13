import { useEffect, useState, type CSSProperties } from 'react'
import type {
  FloatingData,
  FloatView,
  FloatViewLayout,
  InvitationBlock,
} from '../types/invitation.types'

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

// Reference column widths used to keep a float's *physical* size roughly
// consistent across breakpoints when a view hasn't been customized yet. Mobile
// ≈ a phone screen; desktop = the published column max-width. A mobile design
// reused on desktop is scaled down by mobile/desktop so the sticker doesn't
// balloon on the wider column (and vice-versa).
const MOBILE_REF_W = 390
const DESKTOP_REF_W = 920

/** Viewport width (px) at/under which the public view uses the mobile layout. */
const MOBILE_BREAKPOINT = 768

export interface ResolvedFloatLayout {
  xPct: number
  yPct: number
  wPct: number
  rotation: number
  zIndex: number
}

/** The legacy single `block.layout` (or defaults), treated as the mobile design. */
function baseLayout(block: InvitationBlock<'floating'>): FloatViewLayout {
  const l = block.layout
  return {
    xPct: l?.xPct ?? 36,
    yPct: l?.yPct ?? 8,
    wPct: l?.wPct ?? 28,
    rotation: l?.rotation ?? 0,
  }
}

/** Re-fit a layout authored at `fromW` so its physical size matches at `toW`,
 *  keeping the element's horizontal center fixed. */
function refit(src: FloatViewLayout, fromW: number, toW: number): FloatViewLayout {
  const factor = fromW / toW
  const wPct = src.wPct * factor
  const centerX = src.xPct + src.wPct / 2
  return { xPct: centerX - wPct / 2, yPct: src.yPct, wPct, rotation: src.rotation ?? 0 }
}

/**
 * Resolve the effective layout of a canvas-anchored float for a given view.
 * Uses the view's explicit layout when present; otherwise falls back to the
 * other view (size-matched) so each breakpoint stays independent yet sensible.
 */
export function resolveFloatLayout(
  block: InvitationBlock<'floating'>,
  view: FloatView,
): ResolvedFloatLayout {
  const d = block.data as FloatingData
  const zIndex = block.layout?.zIndex ?? 5
  const explicit = d.views?.[view]
  if (explicit) {
    return { ...explicit, rotation: explicit.rotation ?? 0, zIndex }
  }
  const mobile = d.views?.mobile ?? baseLayout(block)
  if (view === 'mobile') {
    const src = d.views?.desktop ? refit(d.views.desktop, DESKTOP_REF_W, MOBILE_REF_W) : mobile
    return { ...src, rotation: src.rotation ?? 0, zIndex }
  }
  // desktop with no explicit layout → scale the mobile design down.
  const src = refit(mobile, MOBILE_REF_W, DESKTOP_REF_W)
  return { ...src, rotation: src.rotation ?? 0, zIndex }
}

/** Just the per-view layout fields (no zIndex), for persisting an edit. */
export function floatViewLayout(
  block: InvitationBlock<'floating'>,
  view: FloatView,
): FloatViewLayout {
  const r = resolveFloatLayout(block, view)
  return { xPct: r.xPct, yPct: r.yPct, wPct: r.wPct, rotation: r.rotation }
}

/**
 * Positioning CSS for a floating block that floats over the invitation column
 * (anchorMode 'canvas'). Percentages resolve against the column box, so the
 * element scrolls with the content and scales with the layout. The `view`
 * selects which independent breakpoint layout to apply. Used by both the public
 * view and the editor (the editor adds drag handlers on top).
 */
export function canvasFloatStyle(
  block: InvitationBlock<'floating'>,
  view: FloatView,
): CSSProperties {
  const r = resolveFloatLayout(block, view)
  return {
    position: 'absolute',
    left: `${r.xPct}%`,
    top: `${r.yPct}%`,
    width: `${r.wPct}%`,
    transform: r.rotation ? `rotate(${r.rotation}deg)` : undefined,
    zIndex: r.zIndex,
  }
}

/** React hook: which float breakpoint the current viewport falls into. */
export function useFloatView(): FloatView {
  const get = (): FloatView =>
    typeof window !== 'undefined' &&
    window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
      ? 'mobile'
      : 'desktop'
  const [view, setView] = useState<FloatView>(get)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const on = () => setView(mq.matches ? 'mobile' : 'desktop')
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return view
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
