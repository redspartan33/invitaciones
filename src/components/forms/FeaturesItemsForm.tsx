import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type { FeatureItem, FeaturesData, InvitationBlock } from '../../types/invitation.types'
import { PlusIcon, TrashIcon } from '../blocks/icons'
import { DragHandle, SortableItem, SortableList } from './SortableItem'

export function FeaturesItemsForm({ block }: { block: InvitationBlock<'features'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const data = block.data as FeaturesData
  const setItems = (items: FeatureItem[]) => updateBlockData(block.id, { items })

  const update = (id: string, patch: Partial<FeatureItem>) =>
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
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Características</h3>
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
                      value={item.label}
                      onChange={(e) => update(item.id, { label: e.target.value })}
                      placeholder="Característica"
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
                  <input
                    type="text"
                    value={item.value ?? ''}
                    onChange={(e) => update(item.id, { value: e.target.value })}
                    placeholder="Valor (opcional)"
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
        onClick={() => setItems([...data.items, { id: uuid(), label: 'Nueva característica', value: '' }])}
        className="btn-flat w-full"
      >
        <PlusIcon className="h-4 w-4" /> Añadir característica
      </button>
    </section>
  )
}
