import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type { InvitationBlock, ReviewItem, ReviewsData } from '../../types/invitation.types'
import { PlusIcon, TrashIcon } from '../blocks/icons'
import { DragHandle, SortableItem, SortableList } from './SortableItem'

export function ReviewsItemsForm({ block }: { block: InvitationBlock<'reviews'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const data = block.data as ReviewsData
  const setItems = (items: ReviewItem[]) => updateBlockData(block.id, { items })

  const update = (id: string, patch: Partial<ReviewItem>) =>
    setItems(data.items.map((it) => (it.id === id ? { ...it, ...patch } : it)))

  const reorder = (fromId: string, toId: string) => {
    const from = data.items.findIndex((it) => it.id === fromId)
    const to = data.items.findIndex((it) => it.id === toId)
    if (from === -1 || to === -1) return
    const copy = [...data.items]
    const [m] = copy.splice(from, 1)
    copy.splice(to, 0, m)
    setItems(copy)
  }

  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Reseñas</h3>
      <SortableList ids={data.items.map((it) => it.id)} onReorder={reorder}>
        <div className="space-y-2">
          {data.items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {({ handleProps }) => (
                <div className="space-y-2 rounded border border-ink-200 bg-surface p-3">
                  <div className="flex items-center gap-2">
                    <DragHandle handleProps={handleProps} />
                    <input
                      type="text"
                      value={item.author}
                      onChange={(e) => update(item.id, { author: e.target.value })}
                      placeholder="Autor"
                      className="input-flat flex-1"
                    />
                    <select
                      value={item.rating ?? 5}
                      onChange={(e) => update(item.id, { rating: Number(e.target.value) })}
                      className="input-flat w-20"
                      title="Calificación"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{n} ★</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setItems(data.items.filter((x) => x.id !== item.id))}
                      className="btn-ghost text-rose-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={item.quote}
                    onChange={(e) => update(item.id, { quote: e.target.value })}
                    placeholder="Testimonio"
                    rows={2}
                    className="input-flat resize-none"
                  />
                  <input
                    type="url"
                    value={item.avatar ?? ''}
                    onChange={(e) => update(item.id, { avatar: e.target.value })}
                    placeholder="Avatar (URL, opcional)"
                    className="input-flat"
                  />
                </div>
              )}
            </SortableItem>
          ))}
        </div>
      </SortableList>
      <button
        type="button"
        onClick={() => setItems([...data.items, { id: uuid(), author: 'Nuevo cliente', rating: 5, quote: '' }])}
        className="btn-flat w-full"
      >
        <PlusIcon className="h-4 w-4" /> Añadir reseña
      </button>
    </section>
  )
}
