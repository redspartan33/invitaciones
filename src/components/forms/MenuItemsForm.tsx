import { useMemo, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type { InvitationBlock, MenuItem, MenuSectionData } from '../../types/invitation.types'
import { parseMenuItems } from '../../utils/parseMenuItems'
import { PlusIcon, TrashIcon } from '../blocks/icons'
import { DragHandle, SortableItem, SortableList } from './SortableItem'

export function MenuItemsForm({ block }: { block: InvitationBlock<'menu-section'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const data = block.data as MenuSectionData
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const pastePreview = useMemo(() => parseMenuItems(pasteText), [pasteText])
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const setItems = (items: MenuItem[]) => updateBlockData(block.id, { items })

  const onPickFile = (itemId: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB (máx 2 MB). Usa una más ligera o pega una URL pública.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () =>
      setItems(data.items.map((x) => (x.id === itemId ? { ...x, image: String(reader.result) } : x)))
    reader.readAsDataURL(file)
  }

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
                      value={item.name}
                      onChange={(e) => update(item.id, { name: e.target.value })}
                      placeholder="Nombre del platillo"
                      className="input-flat flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setItems(data.items.filter((x) => x.id !== item.id))}
                      className="btn-ghost text-rose-600 shrink-0"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
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
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={item.image?.startsWith('data:') ? '' : (item.image ?? '')}
                      onChange={(e) => update(item.id, { image: e.target.value || undefined })}
                      placeholder="URL imagen o sube →"
                      className="input-flat flex-1 min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => fileRefs.current[item.id]?.click()}
                      className="rounded border border-ink-200 bg-white px-3 py-2 text-xs uppercase tracking-widest text-ink-600 hover:border-ink-400"
                    >
                      Subir
                    </button>
                    <input
                      ref={(el) => (fileRefs.current[item.id] = el)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) onPickFile(item.id, f)
                        e.target.value = ''
                      }}
                    />
                    {item.image && (
                      <button
                        type="button"
                        onClick={() => update(item.id, { image: undefined })}
                        className="btn-ghost text-rose-600 shrink-0"
                        title="Quitar imagen"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {item.image && (
                    <div className="overflow-hidden rounded border border-ink-200 bg-ink-50">
                      <img src={item.image} alt="" className="block h-24 w-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </SortableItem>
          ))}
        </div>
      </SortableList>
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
