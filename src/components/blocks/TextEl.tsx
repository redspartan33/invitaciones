import type { CSSProperties, ElementType, ReactNode } from 'react'
import type { InvitationBlock, TextSize } from '../../types/invitation.types'

// Multiplier on top of the element's natural Tailwind text-* size. The
// multiplier is exposed via the `--el-scale` CSS variable, which the
// `.block-scale-active .text-*` rules in index.css factor into the
// computed font-size. For elements without a text-* class we also set
// `font-size: <mult>em` as a fallback so they still scale.
const SIZE_MULT: Record<TextSize, number> = {
  xs: 0.6,
  sm: 0.8,
  md: 1.0,
  lg: 1.4,
  xl: 1.8,
}

const TEXT_CLASS_RE = /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)\b/

interface TextElProps {
  block: InvitationBlock
  field: string
  className?: string
  children: ReactNode
  as?: ElementType
  style?: CSSProperties
}

export function TextEl({ block, field, className, children, as, style: extraStyle }: TextElProps) {
  const Tag = (as ?? 'span') as ElementType
  const override = block.style?.textStyles?.[field]
  const style: CSSProperties = { ...extraStyle }

  if (override?.size && override.size !== 'md') {
    const mult = SIZE_MULT[override.size]
    ;(style as Record<string, string | number>)['--el-scale'] = String(mult)
    // Elements that don't carry their own text-* class won't be matched by
    // the .block-scale-active .text-* rules — apply an inline em fallback.
    if (!className || !TEXT_CLASS_RE.test(className)) {
      style.fontSize = `${mult}em`
    }
    if (mult > 1.1) style.lineHeight = '1.15'
  }
  if (override?.color) style.color = override.color

  const hasStyle = Object.keys(style).length > 0
  return (
    <Tag className={className} style={hasStyle ? style : undefined}>
      {children}
    </Tag>
  )
}
