import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type { InvitationBlock, MenuItem, MenuSectionData } from '../../types/invitation.types'
import { PlusIcon, TrashIcon } from '../blocks/icons'

export function MenuItemsForm({ block }: { block: InvitationBlock<'menu-section'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const data = block.data as MenuSectionData

  const setItems = (items: MenuItem[]) => updateBlockData(block.id, { items })

  const update = (id: string, patch: Partial<MenuItem>) => {
    setItems(data.items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  const move = (id: string, dir: -1 | 1) => {
    const idx = data.items.findIndex((it) => it.id === id)
    const newIdx = idx + dir
    if (idx === -1 || newIdx < 0 || newIdx >= data.items.length) return
    const copy = [...data.items]
    const [m] = copy.splice(idx, 1)
    copy.splice(newIdx, 0, m)
    setItems(copy)
  }

  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Platillos</h3>
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <div key={item.id} className="space-y-2 rounded border border-ink-200 bg-white p-3">
            <input
              type="text"
              value={item.name}
              onChange={(e) => update(item.id, { name: e.target.value })}
              placeholder="Nombre del platillo"
              className="input-flat"
            />
            <input
              type="text"
              value={item.description ?? ''}
              onChange={(e) => update(item.id, { description: e.target.value })}
              placeholder="Descripción / ingredientes (opcional)"
              className="input-flat"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.price ?? ''}
                onChange={(e) => update(item.id, { price: e.target.value })}
                placeholder="$ Precio"
                className="input-flat flex-1 min-w-0"
              />
              <input
                type="text"
                value={item.badges ?? ''}
                onChange={(e) => update(item.id, { badges: e.target.value })}
                placeholder="Etiquetas (V · GF…)"
                className="input-flat flex-1 min-w-0"
              />
              <button className="btn-ghost shrink-0" type="button" onClick={() => move(item.id, -1)} disabled={i === 0} title="Subir">↑</button>
              <button className="btn-ghost shrink-0" type="button" onClick={() => move(item.id, 1)} disabled={i === data.items.length - 1} title="Bajar">↓</button>
              <button
                type="button"
                onClick={() => setItems(data.items.filter((x) => x.id !== item.id))}
                className="btn-ghost text-rose-600 shrink-0"
                title="Eliminar"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          setItems([
            ...data.items,
            { id: uuid(), name: 'Nuevo platillo', description: '', price: '' },
          ])
        }
        className="btn-flat w-full"
      >
        <PlusIcon className="h-4 w-4" /> Añadir platillo
      </button>
    </section>
  )
}
