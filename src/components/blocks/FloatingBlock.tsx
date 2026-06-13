import type { CSSProperties } from 'react'
import type { FontFamily, InvitationBlock } from '../../types/invitation.types'
import { MotionLoop } from './MotionLoop'

const FAMILY_CLASS: Record<FontFamily, string> = {
  serif: 'font-serif',
  'sans-serif': 'font-sans',
  script: 'font-script',
}

/**
 * Renders the *content* of a floating block (optional image and/or optional
 * text) filling its positioned box. The positioning wrapper is provided by the
 * caller — the editor's floating layer, the public view's overlay, or
 * FixedCanvasView. The looping motion is applied here so it animates
 * identically in every context.
 */
export function FloatingBlock({ block }: { block: InvitationBlock<'floating'> }) {
  const d = block.data
  const align = d.align ?? 'center'
  const hasImage = !!d.imageUrl
  const hasText = !!(d.text && d.text.trim())
  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'

  const imgStyle: CSSProperties = {
    width: '100%',
    height: hasText ? 'auto' : '100%',
    maxHeight: '100%',
    objectFit: d.imageFit ?? 'contain',
    borderRadius: d.imageRadius ? `${d.imageRadius}px` : undefined,
    display: 'block',
  }

  const famClass = d.fontFamily && d.fontFamily !== 'inherit' ? FAMILY_CLASS[d.fontFamily] : ''
  const textStyle: CSSProperties = {
    color: d.color || undefined,
    fontSize: d.fontSize ? `${d.fontSize}px` : undefined,
    fontWeight: d.bold ? 700 : undefined,
    fontStyle: d.italic ? 'italic' : undefined,
    textAlign: align,
    lineHeight: 1.25,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    width: '100%',
  }

  const content =
    !hasImage && !hasText ? (
      <div className="flex h-full w-full items-center justify-center rounded bg-black/5 text-xs text-ink-400">
        Flotante vacío
      </div>
    ) : (
      <div
        className="flex h-full w-full flex-col gap-2"
        style={{ alignItems: justify, justifyContent: 'center' }}
      >
        {hasImage && <img src={d.imageUrl} alt={d.imageAlt || ''} style={imgStyle} draggable={false} />}
        {hasText && (
          <div className={famClass} style={textStyle}>
            {d.text}
          </div>
        )}
      </div>
    )

  return (
    <MotionLoop style={block.style}>
      <div className="h-full w-full">{content}</div>
    </MotionLoop>
  )
}
