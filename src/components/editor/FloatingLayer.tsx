import { useRef } from 'react'
import { useEditorStore } from '../../store/editorStore'
import type { InvitationBlock } from '../../types/invitation.types'
import { FloatingBlock } from '../blocks/FloatingBlock'
import { canvasFloatStyle, isScreenAnchored, screenFloatStyle } from '../../utils/floatingLayout'
import { EyeIcon, TrashIcon, CopyIcon } from '../blocks/icons'

/**
 * Editor overlay for floating blocks on a stacked invitation. Spans the full
 * canvas (absolute inset-0). Canvas-anchored floats can be dragged to set their
 * position; screen-anchored ones pin to a corner. The layer itself ignores
 * pointer events so blocks beneath stay clickable — each floating item opts
 * back in.
 */
export function FloatingLayer({ blocks }: { blocks: InvitationBlock<'floating'>[] }) {
  const layerRef = useRef<HTMLDivElement>(null)
  if (blocks.length === 0) return null
  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 z-20">
      {blocks.map((block) =>
        isScreenAnchored(block) ? (
          <FloatingItem key={block.id} block={block} layerRef={layerRef} draggable={false} />
        ) : (
          <FloatingItem key={block.id} block={block} layerRef={layerRef} draggable />
        ),
      )}
    </div>
  )
}

function FloatingItem({
  block,
  layerRef,
  draggable,
}: {
  block: InvitationBlock<'floating'>
  layerRef: React.RefObject<HTMLDivElement | null>
  draggable: boolean
}) {
  const selectedId = useEditorStore((s) => s.selectedBlockId)
  const selectBlock = useEditorStore((s) => s.selectBlock)
  const updateBlockLayout = useEditorStore((s) => s.updateBlockLayout)
  const deleteBlock = useEditorStore((s) => s.deleteBlock)
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock)
  const toggleVisibility = useEditorStore((s) => s.toggleBlockVisibility)
  const selected = selectedId === block.id

  const drag = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)

  const style = isScreenAnchored(block)
    ? screenFloatStyle(block, 'absolute')
    : canvasFloatStyle(block)

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    selectBlock(block.id)
    if (!draggable) return
    const rect = layerRef.current?.getBoundingClientRect()
    if (!rect) return
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: block.layout?.xPct ?? 36,
      baseY: block.layout?.yPct ?? 8,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const rect = layerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return
    const dxPct = ((e.clientX - drag.current.startX) / rect.width) * 100
    const dyPct = ((e.clientY - drag.current.startY) / rect.height) * 100
    const xPct = Math.max(0, Math.min(98, drag.current.baseX + dxPct))
    const yPct = Math.max(0, Math.min(99, drag.current.baseY + dyPct))
    updateBlockLayout(block.id, { xPct, yPct })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* pointer already released */
    }
  }

  return (
    <div
      style={style}
      className={`pointer-events-auto group ${draggable ? 'cursor-move' : 'cursor-pointer'} ${
        selected ? 'outline outline-2 outline-offset-2 outline-ink-900' : ''
      } ${block.visible ? '' : 'opacity-30'}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      <FloatingBlock block={block} />

      {/* Toolbar */}
      <div
        className={`absolute -top-2 right-0 z-10 flex -translate-y-full items-center gap-1 rounded border border-ink-200 bg-surface p-1 transition-opacity ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleVisibility(block.id)
          }}
          className="btn-ghost"
          title={block.visible ? 'Ocultar' : 'Mostrar'}
        >
          <EyeIcon open={block.visible} className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            duplicateBlock(block.id)
          }}
          className="btn-ghost"
          title="Duplicar"
        >
          <CopyIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('¿Eliminar este bloque flotante?')) deleteBlock(block.id)
          }}
          className="btn-ghost text-rose-600"
          title="Eliminar"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
