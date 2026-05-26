import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditorStore } from '../../store/editorStore'
import type { InvitationBlock, ViewportMode } from '../../types/invitation.types'
import { BlockRenderer } from '../blocks/BlockRenderer'
import { BlockBackgroundProvider } from '../blocks/BlockBackgroundContext'
import { DragIcon, EyeIcon, TrashIcon, CopyIcon } from '../blocks/icons'
import { usePageChrome } from '../../hooks/usePageChrome'
import { PageBackgroundLayer } from '../public/PageBackgroundLayer'

// Width of the simulated device frame for each viewport mode.
// Heights mimic common physical dimensions but cap to the available canvas
// space — the inner area scrolls so all blocks remain reachable.
const VIEWPORT_DIMS: Record<ViewportMode, { width: number; height: number; chrome: 'phone' | 'tablet' | 'none' }> = {
  mobile: { width: 390, height: 760, chrome: 'phone' },
  tablet: { width: 820, height: 1080, chrome: 'tablet' },
  desktop: { width: 1100, height: 0, chrome: 'none' },
}

export function Canvas() {
  const blocks = useEditorStore((s) => [...s.invitation.blocks].sort((a, b) => a.order - b.order))
  const selectedId = useEditorStore((s) => s.selectedBlockId)
  const selectBlock = useEditorStore((s) => s.selectBlock)
  const reorderBlocks = useEditorStore((s) => s.reorderBlocks)
  const viewport = useEditorStore((s) => s.viewport)
  const fontFamily = useEditorStore((s) => s.invitation.globalSettings.fontFamily)
  const headingFont = useEditorStore((s) => s.invitation.globalSettings.headingFont)
  const bodyFont = useEditorStore((s) => s.invitation.globalSettings.bodyFont)
  const favicon = useEditorStore((s) => s.invitation.globalSettings.favicon)
  const colorAccent = useEditorStore((s) => s.invitation.globalSettings.colorAccent)
  const colorPrimary = useEditorStore((s) => s.invitation.globalSettings.colorPrimary)
  const colorSecondary = useEditorStore((s) => s.invitation.globalSettings.colorSecondary)
  const pageBackground = useEditorStore((s) => s.invitation.globalSettings.pageBackground)
  const transparentCanvas = useEditorStore((s) => s.invitation.globalSettings.transparentCanvas)
  const hideBlockBackgrounds = useEditorStore(
    (s) => s.invitation.globalSettings.hideBlockBackgrounds,
  )
  usePageChrome({ favicon, headingFont, bodyFont })

  const hasPageBackground = !!pageBackground?.url?.trim()
  // Same defaults as PublicInvitationView: when a page background is set,
  // both toggles default to ON so the user can see what the published page
  // will look like.
  const canvasTransparent = hasPageBackground && transparentCanvas !== false
  const suppressBlockBackgrounds =
    hasPageBackground && hideBlockBackgrounds !== false

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    reorderBlocks(String(active.id), String(over.id))
  }

  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'script' ? 'font-script' : 'font-sans'

  const dim = VIEWPORT_DIMS[viewport]
  const isPhone = dim.chrome === 'phone'
  const isTablet = dim.chrome === 'tablet'

  const canvasBg = canvasTransparent ? 'transparent' : undefined

  const cssVars = {
    ['--color-accent' as never]: colorAccent,
    ['--color-primary' as never]: colorPrimary,
    ['--color-secondary' as never]: colorSecondary,
    ['--font-heading' as never]: headingFont ? `"${headingFont}"` : undefined,
    ['--font-body' as never]: bodyFont ? `"${bodyFont}"` : undefined,
    backgroundColor: hasPageBackground ? 'transparent' : undefined,
  } as React.CSSProperties

  const inner = (
    <BlockBackgroundProvider suppress={suppressBlockBackgrounds}>
      <div
        className={`invitation-canvas h-full ${fontClass}`}
        style={cssVars}
        onClick={(e) => e.stopPropagation()}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, i) => (
              <SortableCanvasBlock
                key={block.id}
                block={block}
                index={i}
                selected={selectedId === block.id}
                onSelect={() => selectBlock(block.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center px-8 py-32 text-center">
            <p className="font-serif text-2xl text-ink-400">Tu invitación está vacía</p>
            <p className="mt-2 text-sm text-ink-500">Añade tu primer bloque desde la barra inferior</p>
          </div>
        )}
      </div>
    </BlockBackgroundProvider>
  )

  // Phone: rounded device frame with a tiny notch chip. Tablet: rounded tablet
  // frame, no notch. Desktop: a bordered surface that fills the canvas (the
  // inner content is capped to `dim.width`).
  //
  // Each frame acts as the clipping + background container for the page
  // background layer. PageBackgroundLayer uses absolute positioning so it
  // stays within the device frame boundary rather than covering the full editor.
  // `isolation: isolate` creates a new stacking context so the PageBackgroundLayer's
  // negative z-index stays trapped behind the inner content but in front of any
  // ancestor's background (otherwise the editor's grey canvas covers it).
  const frameIsolation: React.CSSProperties = hasPageBackground
    ? { isolation: 'isolate' }
    : {}
  const framed = isPhone ? (
    <div
      className="relative rounded-[40px] border border-ink-300 bg-white p-3"
      style={{ width: dim.width + 24, height: dim.height + 24 }}
    >
      <div className="absolute left-1/2 top-3 z-10 h-1 w-12 -translate-x-1/2 rounded-full bg-ink-300" />
      <div
        className="relative h-full w-full overflow-y-auto rounded-[28px] border border-ink-200 scroll-thin"
        style={{ width: dim.width, height: dim.height, background: hasPageBackground ? 'transparent' : 'white', ...frameIsolation }}
      >
        {hasPageBackground && (
          <PageBackgroundLayer bg={{ ...pageBackground!, attachment: 'scroll' }} />
        )}
        <div className="relative" style={{ background: canvasBg }}>{inner}</div>
      </div>
    </div>
  ) : isTablet ? (
    <div
      className="rounded-[24px] border border-ink-300 bg-white p-3"
      style={{ width: dim.width + 24, height: dim.height + 24 }}
    >
      <div
        className="relative h-full w-full overflow-y-auto rounded-[14px] border border-ink-200 scroll-thin"
        style={{ width: dim.width, height: dim.height, background: hasPageBackground ? 'transparent' : 'white', ...frameIsolation }}
      >
        {hasPageBackground && (
          <PageBackgroundLayer bg={{ ...pageBackground!, attachment: 'scroll' }} />
        )}
        <div className="relative" style={{ background: canvasBg }}>{inner}</div>
      </div>
    </div>
  ) : (
    <div
      className="relative w-full max-w-full border border-ink-200"
      style={{ maxWidth: dim.width, background: hasPageBackground ? 'transparent' : 'white', ...frameIsolation }}
    >
      {hasPageBackground && (
        <PageBackgroundLayer bg={{ ...pageBackground!, attachment: 'scroll' }} />
      )}
      <div className="relative" style={{ background: canvasBg }}>{inner}</div>
    </div>
  )

  return (
    <div
      className="flex h-full w-full flex-col items-center overflow-auto bg-ink-100 p-6 scroll-thin md:p-10"
      onClick={() => selectBlock(null)}
    >
      <VariantSwitcher />
      <div className="flex w-full items-start justify-center">{framed}</div>
    </div>
  )
}

function VariantSwitcher() {
  const isMenu = useEditorStore((s) => s.invitation.kind === 'menu')
  const variants = useEditorStore((s) => s.invitation.menuVariants)
  const editingId = useEditorStore((s) => s.invitation.editingVariantId)
  const activeId = useEditorStore((s) => s.invitation.activeVariantId)
  const switchEditing = useEditorStore((s) => s.switchEditingMenuVariant)
  const addVariant = useEditorStore((s) => s.addMenuVariant)

  if (!isMenu || !variants || variants.length === 0) return null

  return (
    <div
      className="mb-4 flex w-full max-w-[1100px] flex-wrap items-center gap-1.5 rounded border border-ink-200 bg-white p-1.5 shadow-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="px-2 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
        Temporada
      </span>
      {variants.map((v) => {
        const isEditing = v.id === editingId
        const isActive = v.id === activeId
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => switchEditing(v.id)}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors ${
              isEditing
                ? 'bg-ink-900 text-white'
                : 'bg-white text-ink-700 hover:bg-ink-50'
            }`}
            title={isActive ? 'Visible por defecto al público' : 'Editar esta temporada'}
          >
            <span>{v.label}</span>
            {isActive && (
              <span className={`text-[9px] ${isEditing ? 'text-amber-200' : 'text-amber-500'}`}>★</span>
            )}
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => {
          const label = prompt('Nombre de la nueva temporada:', `Temporada ${variants.length + 1}`)
          if (label === null) return
          const copy = confirm('¿Duplicar la temporada actual? (Cancelar = empezar vacía)')
          addVariant(label, copy ? editingId : undefined)
        }}
        className="ml-auto rounded border border-dashed border-ink-300 px-2 py-1 text-xs text-ink-500 hover:border-ink-900 hover:text-ink-900"
      >
        + Temporada
      </button>
    </div>
  )
}

function SortableCanvasBlock({
  block,
  index,
  selected,
  onSelect,
}: {
  block: InvitationBlock
  index: number
  selected: boolean
  onSelect: () => void
}) {
  const deleteBlock = useEditorStore((s) => s.deleteBlock)
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock)
  const toggleVisibility = useEditorStore((s) => s.toggleBlockVisibility)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`canvas-block group ${selected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Block content */}
      <div className={block.visible ? '' : 'opacity-30'}>
        <BlockRenderer block={block} />
      </div>

      {/* Indicator number */}
      <div className="pointer-events-none absolute left-2 top-2 select-none rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-ink-400 opacity-0 transition-opacity group-hover:opacity-100">
        {String(index + 1).padStart(2, '0')} {block.type}
      </div>

      {/* Hover toolbar */}
      <div className={`absolute right-2 top-2 z-10 flex items-center gap-1 rounded border border-ink-200 bg-white p-1 transition-opacity ${selected || isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button
          {...attributes}
          {...listeners}
          className="btn-ghost cursor-grab active:cursor-grabbing"
          title="Arrastrar"
          onClick={(e) => e.stopPropagation()}
        >
          <DragIcon className="h-4 w-4" />
        </button>
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
            if (confirm('¿Eliminar este bloque?')) deleteBlock(block.id)
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
