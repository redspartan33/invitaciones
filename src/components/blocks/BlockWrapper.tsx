import type { CSSProperties, ReactNode } from 'react'
import type { BlockStyle } from '../../types/invitation.types'

const padMap: Record<NonNullable<BlockStyle['paddingY']>, string> = {
  sm: 'py-6 md:py-8',
  md: 'py-8 md:py-12',
  lg: 'py-12 md:py-20',
  xl: 'py-16 md:py-28',
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
  const css: CSSProperties = {
    backgroundColor: style?.backgroundColor || undefined,
    color: style?.textColor || undefined,
    textAlign: align,
  }
  return (
    <div className={`block-scale-active block-text-${textSize} ${padding} px-5 md:px-8`} style={css}>
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  )
}
