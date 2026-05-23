import { useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type { InvitationBlock, MenuItem, MenuSectionData } from '../../types/invitation.types'
import { parseMenuItems } from '../../utils/parseMenuItems'
import { PlusIcon, TrashIcon } from '../blocks/icons'

export function MenuItemsForm({ block }: { block: InvitationBlock<'menu-section'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const data = block.data as MenuSectionData
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const pastePreview = useMemo(() => parseMenuItems(pasteText), [pasteText])

  const setItems = (items: MenuItem[]) => updateBlockData(block.id, { items })

  const importPasted = (mode: 'append' | 'replace') => {
    const parsed = parseMenuItems(pasteText)
    if (parsed.length === 0) return
    setItems(mode === 'replace' ? parsed : [...data.items, ...parsed])
    setPasteText('')
    setPasteOpen(false)
  }

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
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Platillos</h3>
        <button
          type="button"
          onClick={() => setPasteOpen((v) => !v)}
          className="text-[11px] font-medium uppercase tracking-widest text-ink-500 hover:text-ink-900"
        >
          {pasteOpen ? 'Cerrar' : 'Pegar texto'}
        </button>
      </div>

      {pasteOpen && (
        <div className="space-y-2 rounded border border-dashed border-ink-300 bg-ink-50 p-3">
          <p className="text-[11px] leading-snug text-ink-600">
            Pega platillos en cualquier formato común: una línea por platillo
            <span className="font-medium"> (Nombre — Descripción — Precio)</span> o
            bloques separados por una línea vacía:
          </p>
          <pre className="overflow-x-auto rounded bg-white p-2 text-[10px] leading-snug text-ink-500">{`Lorraine
Con tocino / with bacon.
$133

Homero
Tomate cherry, queso de cabra y arúgula
$133`}</pre>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Pega aquí…"
            rows={8}
            className="input-flat font-mono text-xs"
          />
          {pasteText.trim() && (
            <p className="text-[11px] text-ink-500">
              Detectados <span className="font-semibold text-ink-900">{pastePreview.length}</span>{' '}
              platillo{pastePreview.length === 1 ? '' : 's'}.
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => importPasted('append')}
              disabled={pastePreview.length === 0}
              className="btn-primary flex-1 justify-center"
            >
              Añadir {pastePreview.length || ''}
            </button>
            <button
              type="button"
              onClick={() => importPasted('replace')}
              disabled={pastePreview.length === 0}
              className="btn-flat flex-1 justify-center"
              title="Reemplaza todos los platillos actuales"
            >
              Reemplazar
            </button>
          </div>
        </div>
      )}

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
