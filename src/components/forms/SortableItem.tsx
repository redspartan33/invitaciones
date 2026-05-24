import type { ReactNode } from 'react'
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DragIcon } from '../blocks/icons'

/**
 * Wraps a list with @dnd-kit's vertical sortable context.
 *
 * Children must be `SortableItem`s whose `id` matches one of `ids`.
 */
export function SortableList({
  ids,
  onReorder,
  children,
}: {
  ids: string[]
  onReorder: (fromId: string, toId: string) => void
  children: ReactNode
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    onReorder(String(active.id), String(over.id))
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}

/**
 * A single sortable row. Render its children alongside the `<DragHandle />`
 * returned by the render prop so the drag affordance lives next to the row's
 * content.
 */
export function SortableItem({
  id,
  children,
}: {
  id: string
  children: (props: { handleProps: React.HTMLAttributes<HTMLElement> }) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 20 : undefined,
    position: 'relative' as const,
  }
  const handleProps = { ...(attributes as object), ...(listeners as object) } as React.HTMLAttributes<HTMLElement>
  return (
    <div ref={setNodeRef} style={style}>
      {children({ handleProps })}
    </div>
  )
}

/** A small visual drag handle button — spread `handleProps` from `SortableItem`. */
export function DragHandle({ handleProps, title = 'Arrastrar para reordenar' }: { handleProps: React.HTMLAttributes<HTMLElement>; title?: string }) {
  return (
    <button
      type="button"
      {...handleProps}
      onClick={(e) => e.preventDefault()}
      className="btn-ghost shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
      title={title}
      aria-label={title}
    >
      <DragIcon className="h-4 w-4" />
    </button>
  )
}
