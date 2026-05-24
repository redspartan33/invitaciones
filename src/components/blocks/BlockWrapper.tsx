import type { CSSProperties, ReactNode } from 'react'
import type { BlockStyle } from '../../types/invitation.types'

const padMap: Record<NonNullable<BlockStyle['paddingY']>, string> = {
  sm: 'py-6 md:py-8',
  md: 'py-8 md:py-12',
  lg: 'py-12 md:py-20',
  xl: 'py-16 md:py-28',
}

/** Vertical gap between repeated/internal elements of a block. Exposed as
 *  a CSS variable so individual blocks pick it up via `style={{gap: 'var(--item-gap)'}}`
 *  or by using utility classes like `space-y-[var(--item-gap)]`. */
const ITEM_GAP_PX: Record<NonNullable<BlockStyle['itemSpacing']>, string> = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.75rem',
  xl: '2.75rem',
}

const BG_POSITION_CSS: Record<NonNullable<BlockStyle['backgroundPosition']>, string> = {
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
  const padding = padMap[style?.paddingY ?? 'lg']
  const textSize = style?.textSize ?? 'md'
  const hasImage = !!style?.backgroundImage
  const css: CSSProperties = {
    backgroundColor: style?.backgroundColor || undefined,
    color: style?.textColor || undefined,
    textAlign: align,
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
  return (
    <div className={`block-scale-active block-text-${textSize} ${padding} px-5 md:px-8`} style={css}>
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  )
}
