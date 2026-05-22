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
import { DragIcon, EyeIcon, TrashIcon, CopyIcon } from '../blocks/icons'

const viewportClass: Record<ViewportMode, string> = {
  mobile: 'max-w-[390px]',
  tablet: 'max-w-[768px]',
  desktop: 'max-w-[920px]',
}

export function Canvas() {
  const blocks = useEditorStore((s) => [...s.invitation.blocks].sort((a, b) => a.order - b.order))
  const selectedId = useEditorStore((s) => s.selectedBlockId)
  const selectBlock = useEditorStore((s) => s.selectBlock)
  const reorderBlocks = useEditorStore((s) => s.reorderBlocks)
  const viewport = useEditorStore((s) => s.viewport)
  const fontFamily = useEditorStore((s) => s.invitation.globalSettings.fontFamily)
  const colorAccent = useEditorStore((s) => s.invitation.globalSettings.colorAccent)
  const colorPrimary = useEditorStore((s) => s.invitation.globalSettings.colorPrimary)
  const colorSecondary = useEditorStore((s) => s.invitation.globalSettings.colorSecondary)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    reorderBlocks(String(active.id), String(over.id))
  }

  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'script' ? 'font-script' : 'font-sans'

  return (
    <div className="h-full overflow-auto bg-ink-100 scroll-thin">
      <div className="mx-auto p-8" onClick={() => selectBlock(null)}>
        <div
          className={`invitation-canvas mx-auto border border-ink-200 transition-all ${viewportClass[viewport]} ${fontClass}`}
          style={
            {
              ['--color-accent' as never]: colorAccent,
              ['--color-primary' as never]: colorPrimary,
              ['--color-secondary' as never]: colorSecondary,
            } as React.CSSProperties
          }
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
      </div>
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
