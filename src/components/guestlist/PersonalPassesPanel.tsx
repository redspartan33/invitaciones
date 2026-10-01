import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadGuestList, type GuestEntry } from '../../utils/guestlistClient'
import {
  MAX_PASS_GUESTS,
  createPass,
  deletePass,
  findPassConfirmation,
  loadPasses,
  passUrl,
  passWhatsAppUrl,
  type PersonalPass,
} from '../../utils/personalPass'

interface Props {
  guestListSlug: string
  /** Public slug of the invitation; pass links can't be built without it. */
  invSlug?: string
  /** Confirmations already loaded by the parent (guest-list page). If omitted the panel loads them. */
  entries?: GuestEntry[]
  /** Message shown when there is no invSlug to build links with. */
  missingInvHint?: string
  /** Notifies the parent when the pass list changes (e.g. to recompute totals). */
  onPassesChange?: (passes: PersonalPass[]) => void
  /** Bumped by the parent to force a reload (e.g. its "Actualizar" button). */
  refreshKey?: number
}

function seats(n: number) {
  return n === 1 ? '1 lugar' : `${n} lugares`
}

function CopyButton({ value, label = 'Copiar link' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="btn-flat whitespace-nowrap"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        } catch {
          window.prompt('Copia el link:', value)
        }
      }}
    >
      {copied ? 'Copiado ✓' : label}
    </button>
  )
}

export function PersonalPassesPanel({
  guestListSlug,
  invSlug,
  entries: entriesProp,
  missingInvHint = 'Publica la invitación para poder generar pases personalizados.',
  onPassesChange,
  refreshKey = 0,
}: Props) {
  const [passes, setPasses] = useState<PersonalPass[] | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [ownEntries, setOwnEntries] = useState<GuestEntry[] | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [created, setCreated] = useState<PersonalPass | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Older passes remember the invitation they were created for; use that as
  // a fallback when the parent couldn't resolve the slug.
  const effectiveInv = invSlug || passes?.find((p) => p.invSlug)?.invSlug

  const reload = useCallback(async () => {
    setLoadError(null)
    const [res, list] = await Promise.all([
      loadPasses(guestListSlug),
      entriesProp ? Promise.resolve(null) : loadGuestList(guestListSlug),
    ])
    if (res.ok) {
      setPasses(res.passes)
    } else {
      setPasses((prev) => prev ?? [])
      setLoadError('No se pudieron cargar los pases.')
    }
    if (list && list.ok) setOwnEntries(list.entries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestListSlug, !!entriesProp])

  useEffect(() => {
    reload()
  }, [reload, refreshKey])

  useEffect(() => {
    if (passes) onPassesChange?.(passes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passes])

  const entries = entriesProp ?? ownEntries ?? []
  const rows = useMemo(
    () =>
      (passes ?? [])
        .slice()
        .reverse()
        .map((p) => ({ pass: p, confirmation: findPassConfirmation(entries, p.id) })),
    [passes, entries],
  )
  const confirmedCount = rows.filter((r) => r.confirmation).length

  const handleDelete = async (id: string) => {
    setDeleting(true)
    const res = await deletePass(guestListSlug, id)
    setDeleting(false)
    setPendingDelete(null)
    if (res.ok) setPasses((prev) => prev?.filter((p) => p.id !== id))
    else setLoadError('No se pudo eliminar el pase. Intenta de nuevo.')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-900">Pases personalizados</p>
          <p className="text-xs text-ink-500">
            {passes === undefined
              ? 'Cargando…'
              : passes.length === 0
              ? 'Crea un link con nombre y lugares ya asignados para cada invitado.'
              : `${passes.length} ${passes.length === 1 ? 'pase' : 'pases'} · ${confirmedCount} confirmado${confirmedCount === 1 ? '' : 's'}`}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary whitespace-nowrap"
          disabled={!effectiveInv}
          onClick={() => {
            setCreated(null)
            setModalOpen(true)
          }}
        >
          + Crear pase personalizado
        </button>
      </div>

      {!effectiveInv && passes !== undefined && <p className="text-xs text-ink-500">{missingInvHint}</p>}
      {loadError && <p className="text-xs text-rose-600">{loadError}</p>}

      {rows.length > 0 && (
        <ul className="divide-y divide-ink-200 rounded-2xl border border-ink-200">
          {rows.map(({ pass, confirmation }) => {
            const link = effectiveInv ? passUrl(pass.invSlug || effectiveInv, guestListSlug, pass.id) : ''
            return (
              <li key={pass.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-ink-900">{pass.name}</span>
                    <span className="text-xs text-ink-500">{seats(pass.guests)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                        confirmation ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-500'
                      }`}
                    >
                      {confirmation ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </div>
                  {pass.note && <p className="mt-0.5 truncate text-xs text-ink-500">“{pass.note}”</p>}
                </div>
                {pendingDelete === pass.id ? (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-ink-600">¿Eliminar pase?</span>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => handleDelete(pass.id)}
                      className="font-semibold uppercase tracking-widest text-rose-600 hover:text-rose-700"
                    >
                      {deleting ? '…' : 'Sí'}
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setPendingDelete(null)}
                      className="uppercase tracking-widest text-ink-500 hover:text-ink-900"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {link && <CopyButton value={link} />}
                    {link && (
                      <a href={passWhatsAppUrl(pass, link)} target="_blank" rel="noreferrer" className="btn-flat">
                        WhatsApp
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setPendingDelete(pass.id)}
                      className="text-xs uppercase tracking-widest text-ink-400 hover:text-rose-600"
                      aria-label={`Eliminar el pase de ${pass.name}`}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {modalOpen && effectiveInv &&
        createPortal(
          <CreatePassModal
            guestListSlug={guestListSlug}
            invSlug={effectiveInv}
            created={created}
            onCreated={(p) => {
              setCreated(p)
              setPasses((prev) => [...(prev ?? []), p])
            }}
            onReset={() => setCreated(null)}
            onClose={() => setModalOpen(false)}
          />,
          document.body,
        )}
    </div>
  )
}

function CreatePassModal({
  guestListSlug,
  invSlug,
  created,
  onCreated,
  onReset,
  onClose,
}: {
  guestListSlug: string
  invSlug: string
  created: PersonalPass | null
  onCreated: (p: PersonalPass) => void
  onReset: () => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [guests, setGuests] = useState(1)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  const link = created ? passUrl(invSlug, guestListSlug, created.id) : ''

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-ink-200 bg-surface p-6 text-ink-900 anim-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pase-modal-title"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="pase-modal-title" className="text-lg font-semibold">
            {created ? 'Pase creado' : 'Nuevo pase personalizado'}
          </h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Cerrar" className="text-xl leading-none text-ink-400 hover:text-ink-900">
            ✕
          </button>
        </div>

        {created ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-600">
              Comparte este link con <span className="font-medium text-ink-900">{created.name}</span> ({seats(created.guests)}).
              Al abrirlo verá la invitación completa con su pase en la sección de confirmación.
            </p>
            <input readOnly value={link} className="input-flat" onFocus={(e) => e.currentTarget.select()} />
            <div className="flex flex-wrap gap-2">
              <CopyButton value={link} />
              <a href={passWhatsAppUrl(created, link)} target="_blank" rel="noreferrer" className="btn-flat">
                Enviar por WhatsApp
              </a>
              <a href={link} target="_blank" rel="noreferrer" className="btn-flat">
                Ver pase
              </a>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-flat"
                onClick={() => {
                  // Reset for the next guest without closing the modal.
                  setName('')
                  setGuests(1)
                  setNote('')
                  onReset()
                }}
              >
                Crear otro
              </button>
              <button type="button" className="btn-primary" onClick={onClose}>
                Listo
              </button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (saving) return
              if (!name.trim()) {
                setError('Escribe el nombre del invitado.')
                return
              }
              setSaving(true)
              setError(null)
              const res = await createPass(guestListSlug, { name, guests, note, invSlug })
              setSaving(false)
              if (res.ok) onCreated(res.pass)
              else
                setError(
                  res.reason === 'network'
                    ? 'No hay conexión con el servidor.'
                    : `No se pudo crear el pase${res.detail ? ` (${res.detail})` : ''}.`,
                )
            }}
          >
            <label className="block">
              <span className="label-flat">Nombre</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Familia Hernández"
                maxLength={120}
                className="input-flat"
              />
            </label>
            <div>
              <span className="label-flat">Número de invitados</span>
              <div className="flex items-center gap-2">
                <button type="button" className="btn-flat w-10" onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="Quitar un invitado">
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_PASS_GUESTS}
                  value={guests}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    setGuests(Number.isFinite(v) ? Math.min(Math.max(v, 1), MAX_PASS_GUESTS) : 1)
                  }}
                  className="input-flat w-20 text-center tabular-nums"
                />
                <button
                  type="button"
                  className="btn-flat w-10"
                  onClick={() => setGuests((g) => Math.min(MAX_PASS_GUESTS, g + 1))}
                  aria-label="Agregar un invitado"
                >
                  +
                </button>
              </div>
            </div>
            <label className="block">
              <span className="label-flat">Mensaje (opcional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej. ¡Nos encantará celebrar contigo!"
                rows={3}
                maxLength={400}
                className="input-flat resize-none"
              />
            </label>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn-flat" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Creando…' : 'Crear pase'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
