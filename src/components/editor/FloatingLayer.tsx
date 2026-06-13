import { useRef } from 'react'
import { useEditorStore } from '../../store/editorStore'
import type { FloatView, InvitationBlock } from '../../types/invitation.types'
import { FloatingBlock } from '../blocks/FloatingBlock'
import {
  canvasFloatStyle,
  isScreenAnchored,
  resolveFloatLayout,
  screenFloatStyle,
} from '../../utils/floatingLayout'
import { EyeIcon, TrashIcon, CopyIcon } from '../blocks/icons'

/**
 * Editor overlay for floating blocks on a stacked invitation. Spans the full
 * canvas (absolute inset-0). Canvas-anchored floats can be dragged to reposition
 * and have on-canvas handles to resize (width) and rotate them directly;
 * screen-anchored ones pin to a corner. The layer itself ignores pointer events
 * so blocks beneath stay clickable — each floating item opts back in.
 */
export function FloatingLayer({ blocks }: { blocks: InvitationBlock<'floating'>[] }) {
  const layerRef = useRef<HTMLDivElement>(null)
  // Mobile and desktop floats are edited independently. The editor's viewport
  // selector decides which breakpoint we're authoring; tablet shares desktop.
  const viewport = useEditorStore((s) => s.viewport)
  const view: FloatView = viewport === 'mobile' ? 'mobile' : 'desktop'
  if (blocks.length === 0) return null
  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 z-20">
      {blocks.map((block) => (
        <FloatingItem
          key={block.id}
          block={block}
          view={view}
          layerRef={layerRef}
          interactive={!isScreenAnchored(block)}
        />
      ))}
    </div>
  )
}

const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v))

// Floating blocks may be dragged well past the canvas edges so a sticker can
// bleed off the "body" freely. The published view clips this overflow
// (overflow-x-clip on the public root), so it never produces a horizontal
// scrollbar — it just reads as the element running off the edge. The clamp is
// generous (not tight) only so an element can't be flung completely out of reach.
const OVERFLOW_X = 80 // % a float may extend past the left/right edges
const OVERFLOW_Y = 50 // % a float may extend past the top/bottom edges

type Corner = 'nw' | 'ne' | 'sw' | 'se'

function FloatingItem({
  block,
  view,
  layerRef,
  interactive,
}: {
  block: InvitationBlock<'floating'>
  view: FloatView
  layerRef: React.RefObject<HTMLDivElement | null>
  interactive: boolean
}) {
  const selectedId = useEditorStore((s) => s.selectedBlockId)
  const selectBlock = useEditorStore((s) => s.selectBlock)
  const updateFloatView = useEditorStore((s) => s.updateFloatView)
  const deleteBlock = useEditorStore((s) => s.deleteBlock)
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock)
  const toggleVisibility = useEditorStore((s) => s.toggleBlockVisibility)
  const selected = selectedId === block.id

  // Current resolved placement for the breakpoint being edited. Handlers read
  // from here so dragging/resizing/rotating start from what's on screen.
  const layout = resolveFloatLayout(block, view)
  const setLayout = (patch: Partial<{ xPct: number; yPct: number; wPct: number; rotation: number }>) =>
    updateFloatView(block.id, view, patch)

  const itemRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const resize = useRef<
    | { handle: Corner; startX: number; startY: number; baseW: number; baseX: number; rad: number; layerW: number }
    | null
  >(null)
  const rotate = useRef<{ cx: number; cy: number } | null>(null)

  const style = isScreenAnchored(block)
    ? screenFloatStyle(block, 'absolute')
    : canvasFloatStyle(block, view)

  // ── Move ────────────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    selectBlock(block.id)
    if (!interactive) return
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: layout.xPct,
      baseY: layout.yPct,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const rect = layerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return
    const dxPct = ((e.clientX - drag.current.startX) / rect.width) * 100
    const dyPct = ((e.clientY - drag.current.startY) / rect.height) * 100
    setLayout({
      xPct: clamp(-OVERFLOW_X, 100 + OVERFLOW_X, drag.current.baseX + dxPct),
      yPct: clamp(-OVERFLOW_Y, 100 + OVERFLOW_Y, drag.current.baseY + dyPct),
    })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null
    releaseCapture(e)
  }

  // ── Resize (width) ────────────────────────────────────────────────────────
  const startResize = (e: React.PointerEvent, handle: Corner) => {
    e.stopPropagation()
    selectBlock(block.id)
    const rect = layerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    resize.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      baseW: layout.wPct,
      baseX: layout.xPct,
      rad: (layout.rotation * Math.PI) / 180,
      layerW: rect.width,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const moveResize = (e: React.PointerEvent) => {
    const r = resize.current
    if (!r) return
    const dx = e.clientX - r.startX
    const dy = e.clientY - r.startY
    // Project the screen delta onto the element's own (possibly rotated) X axis
    // so dragging feels natural even when the block is tilted.
    const localDx = dx * Math.cos(r.rad) + dy * Math.sin(r.rad)
    const dPct = (localDx / r.layerW) * 100
    const onLeft = r.handle === 'nw' || r.handle === 'sw'
    // Left handles grow toward the left (width up, x shifts so the right edge
    // stays put); right handles grow toward the right with x fixed.
    const w = clamp(5, 100, onLeft ? r.baseW - dPct : r.baseW + dPct)
    const x = onLeft ? clamp(-OVERFLOW_X, 100 + OVERFLOW_X, r.baseX + (r.baseW - w)) : r.baseX
    setLayout({ wPct: w, xPct: x })
  }

  const endResize = (e: React.PointerEvent) => {
    resize.current = null
    releaseCapture(e)
  }

  // ── Rotate ────────────────────────────────────────────────────────────────
  const startRotate = (e: React.PointerEvent) => {
    e.stopPropagation()
    selectBlock(block.id)
    const rect = itemRef.current?.getBoundingClientRect()
    if (!rect) return
    rotate.current = { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const moveRotate = (e: React.PointerEvent) => {
    const r = rotate.current
    if (!r) return
    let deg = (Math.atan2(e.clientY - r.cy, e.clientX - r.cx) * 180) / Math.PI + 90
    if (deg > 180) deg -= 360
    if (deg < -180) deg += 360
    // Light magnetic snapping to common angles for clean alignment.
    for (const t of [0, 45, 90, 135, 180, -45, -90, -135, -180]) {
      if (Math.abs(deg - t) < 4) {
        deg = t
        break
      }
    }
    setLayout({ rotation: Math.round(deg) })
  }

  const endRotate = (e: React.PointerEvent) => {
    rotate.current = null
    releaseCapture(e)
  }

  const showHandles = selected && interactive
  const rotation = layout.rotation

  return (
    <div
      ref={itemRef}
      style={style}
      className={`pointer-events-auto group ${interactive ? 'cursor-move' : 'cursor-pointer'} ${
        block.visible ? '' : 'opacity-30'
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Selection outline — accent ring, drawn as an inset overlay so it never
          steals pointer events from the resize/rotate handles. */}
      {selected && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[2px] outline outline-2 outline-offset-2 outline-sky-500"
          aria-hidden
        />
      )}

      <FloatingBlock block={block} />

      {/* Resize + rotate handles (canvas-anchored, selected only) */}
      {showHandles && (
        <>
          {/* Corner rotation zones — a wide grab area centered on each corner so
              that approaching a corner (just outside the small resize dot) lets
              you rotate. The resize dot sits on top (higher z) for the exact
              corner, the surrounding ring rotates. */}
          {(['nw', 'ne', 'sw', 'se'] as Corner[]).map((c) => (
            <div
              key={`rot-${c}`}
              onPointerDown={startRotate}
              onPointerMove={moveRotate}
              onPointerUp={endRotate}
              title={`Girar (${rotation}°) — arrastra desde la esquina`}
              className={`absolute z-10 h-8 w-8 cursor-grab rounded-full active:cursor-grabbing ${rotateCornerPos(c)}`}
            />
          ))}

          {(['nw', 'ne', 'sw', 'se'] as Corner[]).map((c) => (
            <div
              key={c}
              onPointerDown={(e) => startResize(e, c)}
              onPointerMove={moveResize}
              onPointerUp={endResize}
              title="Estirar"
              className={`absolute z-30 h-3 w-3 rounded-full border-2 border-sky-500 bg-white shadow-sm ${cornerPos(c)} ${
                c === 'nw' || c === 'se' ? 'cursor-nwse-resize' : 'cursor-nesw-resize'
              }`}
            />
          ))}

          {/* Rotation handle floating above the top edge */}
          <div
            className="pointer-events-none absolute left-1/2 -top-7 h-7 w-px -translate-x-1/2 bg-sky-500"
            aria-hidden
          />
          <div
            onPointerDown={startRotate}
            onPointerMove={moveRotate}
            onPointerUp={endRotate}
            title={`Girar (${rotation}°)`}
            className="absolute left-1/2 -top-9 z-30 flex h-5 w-5 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border-2 border-sky-500 bg-white shadow-sm active:cursor-grabbing"
          >
            <RotateIcon className="h-3 w-3 text-sky-500" />
          </div>
        </>
      )}

      {/* Toolbar */}
      <div
        className={`absolute -top-2 right-0 z-20 flex -translate-y-full items-center gap-1 rounded border border-ink-200 bg-surface p-1 transition-opacity ${
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

function cornerPos(c: Corner): string {
  switch (c) {
    case 'nw':
      return '-left-1.5 -top-1.5'
    case 'ne':
      return '-right-1.5 -top-1.5'
    case 'sw':
      return '-left-1.5 -bottom-1.5'
    case 'se':
      return '-right-1.5 -bottom-1.5'
  }
}

// Center a wide (h-8 w-8 = 32px) rotation grab zone on each corner: half its
// size (16px) of negative offset on each relevant edge.
function rotateCornerPos(c: Corner): string {
  switch (c) {
    case 'nw':
      return '-left-4 -top-4'
    case 'ne':
      return '-right-4 -top-4'
    case 'sw':
      return '-left-4 -bottom-4'
    case 'se':
      return '-right-4 -bottom-4'
  }
}

function releaseCapture(e: React.PointerEvent) {
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
    /* pointer already released */
  }
}

function RotateIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
      <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
