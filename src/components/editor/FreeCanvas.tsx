import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useEditorStore } from '../../store/editorStore'
import type { InvitationBlock } from '../../types/invitation.types'
import { FixedCanvasStage } from '../blocks/FixedCanvasStage'
import { FreeElementContent } from '../blocks/FreeElementContent'
import { defaultLayoutFor } from '../../utils/blockDefaults'
import { usePageChrome } from '../../hooks/usePageChrome'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

type Corner = 'nw' | 'ne' | 'sw' | 'se'

function isEditableTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

export function FreeCanvas() {
  const blocks = useEditorStore((s) =>
    [...s.invitation.blocks].sort((a, b) => (a.layout?.zIndex ?? 0) - (b.layout?.zIndex ?? 0)),
  )
  const selectedId = useEditorStore((s) => s.selectedBlockId)
  const selectBlock = useEditorStore((s) => s.selectBlock)
  const deleteBlock = useEditorStore((s) => s.deleteBlock)
  const aspect = useEditorStore((s) => s.invitation.canvasAspect ?? '4:5')
  const fontFamily = useEditorStore((s) => s.invitation.globalSettings.fontFamily)
  const headingFont = useEditorStore((s) => s.invitation.globalSettings.headingFont)
  const bodyFont = useEditorStore((s) => s.invitation.globalSettings.bodyFont)
  const favicon = useEditorStore((s) => s.invitation.globalSettings.favicon)
  const colorAccent = useEditorStore((s) => s.invitation.globalSettings.colorAccent)
  const colorPrimary = useEditorStore((s) => s.invitation.globalSettings.colorPrimary)
  const colorSecondary = useEditorStore((s) => s.invitation.globalSettings.colorSecondary)

  usePageChrome({ favicon, headingFont, bodyFont })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !isEditableTarget(e.target)) {
        e.preventDefault()
        deleteBlock(selectedId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, deleteBlock])

  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'script' ? 'font-script' : 'font-sans'
  const cssVars = {
    ['--color-accent' as never]: colorAccent,
    ['--color-primary' as never]: colorPrimary,
    ['--color-secondary' as never]: colorSecondary,
    ['--font-heading' as never]: headingFont ? `"${headingFont}"` : undefined,
    ['--font-body' as never]: bodyFont ? `"${bodyFont}"` : undefined,
    position: 'absolute',
    inset: 0,
  } as CSSProperties

  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-auto bg-ink-100 p-6 scroll-thin md:p-10"
      onClick={() => selectBlock(null)}
    >
      <div className="h-full w-full" onClick={(e) => e.stopPropagation()}>
        <FixedCanvasStage aspect={aspect} fit="contain" background={colorSecondary || '#ffffff'} maxScale={1}>
          <div
            className={`invitation-canvas ${fontClass}`}
            style={cssVars}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) selectBlock(null)
            }}
          >
            {blocks.map((block) => (
              <FreeElement
                key={block.id}
                block={block}
                selected={block.id === selectedId}
                onSelect={() => selectBlock(block.id)}
              />
            ))}
          </div>
        </FixedCanvasStage>
      </div>
    </div>
  )
}

function FreeElement({
  block,
  selected,
  onSelect,
}: {
  block: InvitationBlock
  selected: boolean
  onSelect: () => void
}) {
  const updateLayout = useEditorStore((s) => s.updateBlockLayout)
  const ref = useRef<HTMLDivElement>(null)
  const layout = block.layout ?? defaultLayoutFor(block.type)

  const getStageRect = () => {
    const stage = ref.current?.closest('[data-canvas-stage]') as HTMLElement | null
    return stage?.getBoundingClientRect() ?? null
  }

  const endGesture = (onMove: (e: PointerEvent) => void) => {
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const startMove = (e: ReactPointerEvent) => {
    e.stopPropagation()
    onSelect()
    if (layout.locked) return
    const stage = getStageRect()
    if (!stage) return
    const start = { px: e.clientX, py: e.clientY, x: layout.xPct, y: layout.yPct }
    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - start.px) / stage.width) * 100
      const dy = ((ev.clientY - start.py) / stage.height) * 100
      updateLayout(block.id, {
        xPct: clamp(start.x + dx, -40, 100),
        yPct: clamp(start.y + dy, -40, 100),
      })
    }
    endGesture(onMove)
  }

  const startResize = (corner: Corner) => (e: ReactPointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onSelect()
    if (layout.locked) return
    const stage = getStageRect()
    if (!stage) return
    const start = {
      px: e.clientX,
      py: e.clientY,
      x: layout.xPct,
      y: layout.yPct,
      w: layout.wPct,
      h: layout.hPct,
    }
    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - start.px) / stage.width) * 100
      const dy = ((ev.clientY - start.py) / stage.height) * 100
      let { x, y, w, h } = start
      if (corner === 'ne' || corner === 'se') w = Math.max(2, start.w + dx)
      if (corner === 'sw' || corner === 'se') h = Math.max(1, start.h + dy)
      if (corner === 'nw' || corner === 'sw') {
        w = Math.max(2, start.w - dx)
        x = start.x + (start.w - w)
      }
      if (corner === 'nw' || corner === 'ne') {
        h = Math.max(1, start.h - dy)
        y = start.y + (start.h - h)
      }
      updateLayout(block.id, { xPct: x, yPct: y, wPct: w, hPct: h })
    }
    endGesture(onMove)
  }

  const startRotate = (e: ReactPointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onSelect()
    if (layout.locked) return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const onMove = (ev: PointerEvent) => {
      const ang = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90
      const snapped = ev.shiftKey ? Math.round(ang / 15) * 15 : Math.round(ang)
      updateLayout(block.id, { rotation: snapped })
    }
    endGesture(onMove)
  }

  const style: CSSProperties = {
    position: 'absolute',
    left: `${layout.xPct}%`,
    top: `${layout.yPct}%`,
    width: `${layout.wPct}%`,
    height: `${layout.hPct}%`,
    transform: `rotate(${layout.rotation ?? 0}deg)`,
    transformOrigin: 'center center',
    zIndex: layout.zIndex ?? 0,
    opacity: block.visible ? 1 : 0.3,
    cursor: layout.locked ? 'default' : 'move',
    touchAction: 'none',
    outline: selected ? '2px solid var(--color-accent, #b08968)' : '1px dashed rgba(0,0,0,0.18)',
    outlineOffset: 0,
  }

  return (
    <div ref={ref} style={style} onPointerDown={startMove}>
      <div className="pointer-events-none h-full w-full">
        <FreeElementContent block={block} />
      </div>

      {selected && !layout.locked && (
        <>
          <Handle corner="nw" onPointerDown={startResize('nw')} />
          <Handle corner="ne" onPointerDown={startResize('ne')} />
          <Handle corner="sw" onPointerDown={startResize('sw')} />
          <Handle corner="se" onPointerDown={startResize('se')} />
          {/* Rotate handle, centered above the element */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: -56, height: 56, width: 2, background: 'var(--color-accent, #b08968)' }}
          />
          <div
            onPointerDown={startRotate}
            className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-[color:var(--color-accent,#b08968)]"
            style={{ top: -76, height: 26, width: 26, cursor: 'grab', touchAction: 'none' }}
            title="Rotar"
          />
        </>
      )}
    </div>
  )
}

function Handle({
  corner,
  onPointerDown,
}: {
  corner: Corner
  onPointerDown: (e: ReactPointerEvent) => void
}) {
  const pos: CSSProperties = {
    position: 'absolute',
    width: 22,
    height: 22,
    background: '#ffffff',
    border: '2px solid var(--color-accent, #b08968)',
    borderRadius: 4,
    touchAction: 'none',
  }
  if (corner === 'nw') Object.assign(pos, { top: -11, left: -11, cursor: 'nwse-resize' })
  if (corner === 'ne') Object.assign(pos, { top: -11, right: -11, cursor: 'nesw-resize' })
  if (corner === 'sw') Object.assign(pos, { bottom: -11, left: -11, cursor: 'nesw-resize' })
  if (corner === 'se') Object.assign(pos, { bottom: -11, right: -11, cursor: 'nwse-resize' })
  return <div style={pos} onPointerDown={onPointerDown} />
}
