import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type { FaqData, FaqItem, InvitationBlock } from '../../types/invitation.types'
import { PlusIcon, TrashIcon } from '../blocks/icons'
import { DragHandle, SortableItem, SortableList } from './SortableItem'

export function FaqItemsForm({ block }: { block: InvitationBlock<'faq'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const data = block.data as FaqData
  const setItems = (items: FaqItem[]) => updateBlockData(block.id, { items })

  const update = (id: string, patch: Partial<FaqItem>) =>
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
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Preguntas</h3>
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
                      value={item.question}
                      onChange={(e) => update(item.id, { question: e.target.value })}
                      placeholder="Pregunta"
                      className="input-flat flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setItems(data.items.filter((x) => x.id !== item.id))}
                      className="btn-ghost text-rose-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={item.answer}
                    onChange={(e) => update(item.id, { answer: e.target.value })}
                    placeholder="Respuesta"
                    rows={2}
                    className="input-flat resize-none"
                  />
                </div>
              )}
            </SortableItem>
          ))}
        </div>
      </SortableList>
      <button
        type="button"
        onClick={() => setItems([...data.items, { id: uuid(), question: 'Nueva pregunta', answer: '' }])}
        className="btn-flat w-full"
      >
        <PlusIcon className="h-4 w-4" /> Añadir pregunta
      </button>
    </section>
  )
}
