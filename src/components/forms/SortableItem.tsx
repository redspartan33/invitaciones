import type { CSSProperties, ReactNode } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/**
 * Wraps a list with @dnd-kit's vertical sortable context.
 *
 * Children must be `SortableItem`s whose `id` matches one of `ids`.
 *
 * Uses a pointer sensor with a short distance activation so the user can
 * grab anywhere on the visible row (the explicit handle) without needing
 * a hold delay; inputs/buttons inside still receive their normal events
 * because their pointerdown bubbles BEFORE the sensor's activation
 * distance is reached.
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
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
  children: (props: { handleProps: React.HTMLAttributes<HTMLElement>; isDragging: boolean }) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : undefined,
    position: 'relative',
    boxShadow: isDragging ? '0 0 0 2px var(--color-accent, #b08968)' : undefined,
  }
  const handleProps = {
    ...(attributes as object),
    ...(listeners as object),
  } as React.HTMLAttributes<HTMLElement>
  return (
    <div ref={setNodeRef} style={style}>
      {children({ handleProps, isDragging })}
    </div>
  )
}

/**
 * Prominent visual drag handle — spread `handleProps` from `SortableItem`.
 * Renders an obvious 6-dot grip so the user understands the row is draggable.
 */
export function DragHandle({
  handleProps,
  title = 'Arrastrar para reordenar',
}: {
  handleProps: React.HTMLAttributes<HTMLElement>
  title?: string
}) {
  return (
    <button
      type="button"
      {...handleProps}
      onClick={(e) => e.preventDefault()}
      className="group flex shrink-0 cursor-grab touch-none select-none items-center justify-center rounded border border-ink-200 bg-ink-50 px-1.5 py-2 text-ink-400 hover:border-ink-400 hover:text-ink-700 active:cursor-grabbing"
      title={title}
      aria-label={title}
    >
      <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true" className="block">
        <circle cx="2" cy="2" r="1.4" fill="currentColor" />
        <circle cx="8" cy="2" r="1.4" fill="currentColor" />
        <circle cx="2" cy="8" r="1.4" fill="currentColor" />
        <circle cx="8" cy="8" r="1.4" fill="currentColor" />
        <circle cx="2" cy="14" r="1.4" fill="currentColor" />
        <circle cx="8" cy="14" r="1.4" fill="currentColor" />
      </svg>
    </button>
  )
}
