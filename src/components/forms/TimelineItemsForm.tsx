import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type { InvitationBlock, TimelineData, TimelineItem } from '../../types/invitation.types'
import { PlusIcon, TrashIcon } from '../blocks/icons'

const ICONS: TimelineItem['icon'][] = ['ceremony', 'cocktail', 'dinner', 'dance', 'cake', 'speech', 'generic']

export function TimelineItemsForm({ block }: { block: InvitationBlock<'timeline'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const data = block.data as TimelineData

  const setItems = (items: TimelineItem[]) => updateBlockData(block.id, { items })

  const update = (id: string, patch: Partial<TimelineItem>) => {
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
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Actividades</h3>
      <div className="space-y-2">
        {data.items.map((item, i) => (
          <div key={item.id} className="space-y-2 rounded border border-ink-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={item.time}
                onChange={(e) => update(item.id, { time: e.target.value })}
                className="input-flat w-28"
              />
              <input
                type="text"
                value={item.title}
                onChange={(e) => update(item.id, { title: e.target.value })}
                placeholder="Actividad"
                className="input-flat flex-1"
              />
              <button className="btn-ghost" type="button" onClick={() => move(item.id, -1)} disabled={i === 0} title="Subir">↑</button>
              <button className="btn-ghost" type="button" onClick={() => move(item.id, 1)} disabled={i === data.items.length - 1} title="Bajar">↓</button>
              <button
                type="button"
                onClick={() => setItems(data.items.filter((x) => x.id !== item.id))}
                className="btn-ghost text-rose-600"
                title="Eliminar"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              value={item.description ?? ''}
              onChange={(e) => update(item.id, { description: e.target.value })}
              placeholder="Descripción (opcional)"
              className="input-flat"
            />
            <div className="flex flex-wrap gap-1">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => update(item.id, { icon: ic })}
                  className={`rounded border px-2 py-1 text-[10px] uppercase tracking-widest ${
                    item.icon === ic
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          setItems([
            ...data.items,
            { id: uuid(), time: '20:00', title: 'Nueva actividad', icon: 'generic' },
          ])
        }
        className="btn-flat w-full"
      >
        <PlusIcon className="h-4 w-4" /> Añadir actividad
      </button>
    </section>
  )
}
