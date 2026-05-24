import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type { GiftRegistryData, GiftRegistryItem, InvitationBlock } from '../../types/invitation.types'
import { PlusIcon, TrashIcon } from '../blocks/icons'
import { DragHandle, SortableItem, SortableList } from './SortableItem'

export function GiftRegistryItemsForm({ block }: { block: InvitationBlock<'gift-registry'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const data = block.data as GiftRegistryData
  const setItems = (items: GiftRegistryItem[]) => updateBlockData(block.id, { items })

  const update = (id: string, patch: Partial<GiftRegistryItem>) =>
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
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Tiendas / regalos</h3>
      <SortableList ids={data.items.map((it) => it.id)} onReorder={reorder}>
        <div className="space-y-2">
          {data.items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {({ handleProps }) => (
                <div className="space-y-2 rounded border border-ink-200 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <DragHandle handleProps={handleProps} />
                    <input
                      type="text"
                      value={item.storeName}
                      onChange={(e) => update(item.id, { storeName: e.target.value })}
                      placeholder="Tienda"
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
                    type="url"
                    value={item.link}
                    onChange={(e) => update(item.id, { link: e.target.value })}
                    placeholder="https://..."
                    className="input-flat"
                  />
                  <input
                    type="text"
                    value={item.description ?? ''}
                    onChange={(e) => update(item.id, { description: e.target.value })}
                    placeholder="Descripción"
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
        onClick={() => setItems([...data.items, { id: uuid(), storeName: 'Nueva tienda', link: '' }])}
        className="btn-flat w-full"
      >
        <PlusIcon className="h-4 w-4" /> Añadir tienda
      </button>
    </section>
  )
}
