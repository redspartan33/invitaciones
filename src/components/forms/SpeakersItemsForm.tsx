import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type { InvitationBlock, SpeakerItem, SpeakersData } from '../../types/invitation.types'
import { PlusIcon, TrashIcon } from '../blocks/icons'
import { DragHandle, SortableItem, SortableList } from './SortableItem'

export function SpeakersItemsForm({ block }: { block: InvitationBlock<'speakers'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const data = block.data as SpeakersData
  const setItems = (items: SpeakerItem[]) => updateBlockData(block.id, { items })

  const update = (id: string, patch: Partial<SpeakerItem>) =>
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
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Invitados</h3>
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
                      value={item.name}
                      onChange={(e) => update(item.id, { name: e.target.value })}
                      placeholder="Nombre"
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
                    value={item.role ?? ''}
                    onChange={(e) => update(item.id, { role: e.target.value })}
                    placeholder="Rol (ej. Conferencista, DJ)"
                    className="input-flat"
                  />
                  <textarea
                    value={item.bio ?? ''}
                    onChange={(e) => update(item.id, { bio: e.target.value })}
                    placeholder="Bio (opcional)"
                    rows={2}
                    className="input-flat resize-none"
                  />
                  <input
                    type="url"
                    value={item.photo ?? ''}
                    onChange={(e) => update(item.id, { photo: e.target.value })}
                    placeholder="Foto (URL, opcional)"
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
        onClick={() => setItems([...data.items, { id: uuid(), name: 'Nuevo invitado', role: '' }])}
        className="btn-flat w-full"
      >
        <PlusIcon className="h-4 w-4" /> Añadir invitado
      </button>
    </section>
  )
}
