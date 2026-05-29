import type { CSSProperties } from 'react'
import type { FontFamily, InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'

const FAMILY_CLASS: Record<FontFamily, string> = {
  serif: 'font-serif',
  'sans-serif': 'font-sans',
  script: 'font-script',
}

/**
 * A free-form text box. `free` is set by the fixed-canvas editor/public view,
 * where the element fills its positioned box. Without `free` it renders as a
 * normal block in the stacked flow.
 */
export function TextBlock({ block, free }: { block: InvitationBlock<'text'>; free?: boolean }) {
  const d = block.data
  const align = d.align ?? 'center'
  const textStyle: CSSProperties = {
    color: d.color || undefined,
    fontSize: d.fontSize ? `${d.fontSize}px` : undefined,
    fontWeight: d.bold ? 700 : undefined,
    fontStyle: d.italic ? 'italic' : undefined,
    textAlign: align,
    lineHeight: d.lineHeight ?? 1.25,
    letterSpacing: d.letterSpacing ? `${d.letterSpacing}em` : undefined,
    textTransform: d.uppercase ? 'uppercase' : undefined,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    width: '100%',
  }
  const famClass =
    d.fontFamily && d.fontFamily !== 'inherit' ? FAMILY_CLASS[d.fontFamily] : ''
  const content = (
    <div className={famClass} style={textStyle}>
      {d.text || ' '}
    </div>
  )

  if (free) {
    const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
    return (
      <div className="flex h-full w-full" style={{ alignItems: 'center', justifyContent: justify }}>
        {content}
      </div>
    )
  }
  return (
    <BlockWrapper style={block.style} align={align}>
      {content}
    </BlockWrapper>
  )
}
