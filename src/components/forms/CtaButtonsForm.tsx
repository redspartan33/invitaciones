import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type { CtaButton, CtaData, InvitationBlock } from '../../types/invitation.types'
import { initGuestList } from '../../utils/guestlistClient'
import { PlusIcon, TrashIcon } from '../blocks/icons'
import { DragHandle, SortableItem, SortableList } from './SortableItem'

const ACTIONS: { value: CtaButton['action']; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'link', label: 'Comprar / link' },
  { value: 'form', label: 'Formulario de interés' },
]

function makeSlug() {
  const r = Math.random().toString(36).slice(2, 8)
  const t = Date.now().toString(36).slice(-4)
  return `${r}${t}`
}

export function CtaButtonsForm({ block }: { block: InvitationBlock<'cta'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const data = block.data as CtaData
  const setButtons = (buttons: CtaButton[]) => updateBlockData(block.id, { buttons })

  const update = (id: string, patch: Partial<CtaButton>) =>
    setButtons(data.buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)))

  // When a button switches to the "form" action, lazily create a lead list so
  // the public form has somewhere to submit (reuses the guestlist infra).
  const ensureLeadList = async () => {
    if (data.leadListSlug) return
    const slug = makeSlug()
    const link = `${window.location.origin}/?guestlist=${slug}`
    await initGuestList(slug)
    updateBlockData(block.id, { leadListSlug: slug, leadListLink: link })
  }

  const reorder = (fromId: string, toId: string) => {
    const from = data.buttons.findIndex((b) => b.id === fromId)
    const to = data.buttons.findIndex((b) => b.id === toId)
    if (from === -1 || to === -1) return
    const copy = [...data.buttons]
    const [m] = copy.splice(from, 1)
    copy.splice(to, 0, m)
    setButtons(copy)
  }

  const hasForm = data.buttons.some((b) => b.action === 'form')

  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Botones</h3>
      <SortableList ids={data.buttons.map((b) => b.id)} onReorder={reorder}>
        <div className="space-y-2">
          {data.buttons.map((b) => (
            <SortableItem key={b.id} id={b.id}>
              {({ handleProps }) => (
                <div className="space-y-2 rounded border border-ink-200 bg-surface p-3">
                  <div className="flex items-center gap-2">
                    <DragHandle handleProps={handleProps} />
                    <input
                      type="text"
                      value={b.label}
                      onChange={(e) => update(b.id, { label: e.target.value })}
                      placeholder="Texto del botón"
                      className="input-flat flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setButtons(data.buttons.filter((x) => x.id !== b.id))}
                      className="btn-ghost text-rose-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={b.action}
                      onChange={(e) => {
                        const action = e.target.value as CtaButton['action']
                        update(b.id, { action })
                        if (action === 'form') void ensureLeadList()
                      }}
                      className="input-flat"
                    >
                      {ACTIONS.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                    <select
                      value={b.variant ?? 'primary'}
                      onChange={(e) => update(b.id, { variant: e.target.value as CtaButton['variant'] })}
                      className="input-flat"
                    >
                      <option value="primary">Estilo primario</option>
                      <option value="secondary">Estilo secundario</option>
                    </select>
                  </div>
                  {b.action === 'whatsapp' && (
                    <>
                      <input
                        type="text"
                        value={b.value ?? ''}
                        onChange={(e) => update(b.id, { value: e.target.value })}
                        placeholder="Teléfono con código país, ej. 525512345678"
                        className="input-flat"
                      />
                      <input
                        type="text"
                        value={b.message ?? ''}
                        onChange={(e) => update(b.id, { message: e.target.value })}
                        placeholder="Mensaje predefinido (opcional)"
                        className="input-flat"
                      />
                    </>
                  )}
                  {b.action === 'link' && (
                    <input
                      type="url"
                      value={b.value ?? ''}
                      onChange={(e) => update(b.id, { value: e.target.value })}
                      placeholder="https://..."
                      className="input-flat"
                    />
                  )}
                  {b.action === 'form' && (
                    <p className="text-[11px] text-ink-400">
                      Abre un formulario de interés. Configura los textos en la sección "Formulario de interés".
                    </p>
                  )}
                </div>
              )}
            </SortableItem>
          ))}
        </div>
      </SortableList>
      <button
        type="button"
        onClick={() => setButtons([...data.buttons, { id: uuid(), label: 'Nuevo botón', action: 'link', value: '', variant: 'primary' }])}
        className="btn-flat w-full"
      >
        <PlusIcon className="h-4 w-4" /> Añadir botón
      </button>

      {hasForm && (
        <div className="rounded-3xl border border-ink-200 bg-surface px-4 py-4">
          <p className="text-sm text-ink-600">Copia este link para ver los interesados que llenaron el formulario.</p>
          {data.leadListLink ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input readOnly value={data.leadListLink} className="input-flat flex-1" />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(data.leadListLink ?? '')}
                className="btn-primary whitespace-nowrap"
              >
                Copiar link
              </button>
            </div>
          ) : (
            <div className="mt-2 text-sm text-ink-500">Generando link…</div>
          )}
        </div>
      )}
    </section>
  )
}
