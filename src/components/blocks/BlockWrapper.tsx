import type { CSSProperties, ReactNode } from 'react'
import type { BlockStyle } from '../../types/invitation.types'
import { useSuppressBlockBackgrounds } from './BlockBackgroundContext'

export const PAD_Y_CLASS: Record<NonNullable<BlockStyle['paddingY']>, string> = {
  sm: 'py-6 md:py-8',
  md: 'py-8 md:py-12',
  lg: 'py-12 md:py-20',
  xl: 'py-16 md:py-28',
}

/** Vertical gap between repeated/internal elements of a block. Exposed as
 *  a CSS variable so individual blocks pick it up via `style={{gap: 'var(--item-gap)'}}`
 *  or by using utility classes like `space-y-[var(--item-gap)]`. */
export const ITEM_GAP_PX: Record<NonNullable<BlockStyle['itemSpacing']>, string> = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.75rem',
  xl: '2.75rem',
}

// Backwards-compat alias for internal use.
const padMap = PAD_Y_CLASS

const BORDER_RADIUS_PX: Record<NonNullable<BlockStyle['borderRadius']>, string> = {
  none: '0',
  sm: '6px',
  md: '12px',
  lg: '20px',
  xl: '32px',
  '2xl': '48px',
  full: '9999px',
}

export const BG_POSITION_CSS: Record<NonNullable<BlockStyle['backgroundPosition']>, string> = {
  center: 'center',
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  'top-left': 'top left',
  'top-right': 'top right',
  'bottom-left': 'bottom left',
  'bottom-right': 'bottom right',
}

export function BlockWrapper({
  style,
  children,
  align = 'center',
}: {
  style?: BlockStyle
  children: ReactNode
  align?: 'left' | 'center' | 'right'
}) {
  const suppressBg = useSuppressBlockBackgrounds()
  const hasCustomPadding = style?.paddingTop !== undefined || style?.paddingBottom !== undefined
  const padding = hasCustomPadding
    ? 'px-5 md:px-8'
    : `${padMap[style?.paddingY ?? 'lg']} px-5 md:px-8`
  const textSize = style?.textSize ?? 'md'
  const hasImage = !!style?.backgroundImage && !suppressBg
  const radiusPx = BORDER_RADIUS_PX[style?.borderRadius ?? 'none']
  const css: CSSProperties = {
    backgroundColor: suppressBg ? undefined : style?.backgroundColor || undefined,
    color: style?.textColor || undefined,
    textAlign: align,
    paddingTop: style?.paddingTop !== undefined ? `${style.paddingTop}px` : undefined,
    paddingBottom: style?.paddingBottom !== undefined ? `${style.paddingBottom}px` : undefined,
    // Apply borderRadius to the block container. `overflow: hidden` ensures
    // the bg image is clipped by the rounded corners (otherwise it would
    // spill out of the rounded box on browsers that don't auto-clip).
    ...(style?.borderRadius && style.borderRadius !== 'none'
      ? { borderRadius: radiusPx, overflow: 'hidden' }
      : undefined),
    ...(hasImage
      ? {
          backgroundImage: `url(${style!.backgroundImage})`,
          backgroundSize: style?.backgroundSize ?? 'cover',
          backgroundPosition: BG_POSITION_CSS[style?.backgroundPosition ?? 'center'],
          backgroundRepeat: 'no-repeat',
        }
      : undefined),
  }
  ;(css as Record<string, string>)['--item-gap'] = ITEM_GAP_PX[style?.itemSpacing ?? 'md']
  ;(css as Record<string, string>)['--block-radius'] = radiusPx
  return (
    <div className={`block-scale-active block-text-${textSize} ${padding}`} style={css}>
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  )
}
