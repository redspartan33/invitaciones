import { useEffect, useMemo, useState } from 'react'
import { deleteGuestEntry, loadGuestList, loadGuestListMeta, type GuestEntry } from '../../utils/guestlistClient'

/** Lowercase, trimmed, accent-stripped — for tolerant placeholder matching. */
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function GuestListView({ slug }: { slug: string }) {
  const [entries, setEntries] = useState<GuestEntry[] | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [messageLabel, setMessageLabel] = useState<string>('')
  const [messagePlaceholder, setMessagePlaceholder] = useState<string>('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadGuestListMeta(slug).then((meta) => {
      if (cancelled) return
      setMessageLabel(meta.messageLabel?.trim() || '')
      setMessagePlaceholder(meta.messagePlaceholder?.trim() || '')
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  const loadEntries = async () => {
    setEntries(undefined)
    setLoadError(null)
    const result = await loadGuestList(slug)
    if (result.ok) {
      setEntries(result.entries)
    } else {
      setEntries([])
      const base = result.reason === 'network'
        ? 'No hay conexión con el servidor.'
        : 'El servidor no respondió correctamente.'
      setLoadError(result.detail ? `${base} (${result.detail})` : base)
    }
  }

  useEffect(() => {
    loadEntries()
  }, [slug])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'guestlist-updated' || !event.newValue) return
      try {
        const parsed = JSON.parse(event.newValue)
        if (parsed?.slug === slug) {
          loadEntries()
        }
      } catch {
        // ignore invalid events
      }
    }
    const onFocus = () => loadEntries()
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [slug])

  const filtered = useMemo(() => {
    if (!entries) return []
    const qq = q.trim().toLowerCase()
    if (!qq) return entries.slice().reverse()
    return entries.filter((e) => e.name.toLowerCase().includes(qq) || (e.message || '').toLowerCase().includes(qq)).slice().reverse()
  }, [entries, q])

  const total = entries?.length ?? 0
  const isSearching = q.trim().length > 0

  // When the editor configured the message field as a guest-count question,
  // sum the numeric answers to show a "Número de acompañantes" total.
  const isCompanionCount = normalize(messagePlaceholder) === 'numero de acompanantes'
  const companionTotal = useMemo(() => {
    if (!isCompanionCount || !entries) return 0
    return entries.reduce((sum, e) => {
      const msg = (e.message || '').trim()
      return /^\d+$/.test(msg) ? sum + parseInt(msg, 10) : sum
    }, 0)
  }, [isCompanionCount, entries])

  const confirmingEntry = entries?.find((e) => e.id === confirmingId)

  const handleConfirmDelete = async () => {
    if (!confirmingId || deleting) return
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteGuestEntry(slug, confirmingId)
    setDeleting(false)
    if (result.ok) {
      setEntries((prev) => prev?.filter((e) => e.id !== confirmingId))
      setConfirmingId(null)
    } else {
      const base = result.reason === 'network'
        ? 'No hay conexión con el servidor.'
        : 'El servidor no pudo eliminar la confirmación.'
      setDeleteError(result.detail ? `${base} (${result.detail})` : base)
    }
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-2xl p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold">Lista de invitados</h1>
          <button
            type="button"
            onClick={loadEntries}
            className="text-xs uppercase tracking-widest text-ink-500 hover:text-ink-900"
            aria-label="Recargar lista"
          >
            Actualizar
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-4 rounded-2xl border border-ink-200 bg-white p-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">Confirmados</span>
            <span className="text-4xl font-semibold tabular-nums text-ink-900">
              {entries === undefined ? '…' : total}
            </span>
          </div>
          {isCompanionCount && entries && (
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">Número de acompañantes</span>
              <span className="text-4xl font-semibold tabular-nums text-ink-900">{companionTotal}</span>
            </div>
          )}
          {isSearching && entries && (
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">Resultados</span>
              <span className="text-4xl font-semibold tabular-nums text-ink-900">{filtered.length}</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o mensaje"
            className="input-field w-full"
          />
        </div>

        {loadError && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {loadError} <button type="button" onClick={loadEntries} className="ml-2 underline">Reintentar</button>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {entries === undefined && <div className="text-sm text-ink-500">Cargando…</div>}
          {entries && entries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-6 text-center text-sm text-ink-500">
              Aún no hay confirmaciones.
            </div>
          )}
          {entries && entries.length > 0 && filtered.length === 0 && isSearching && (
            <div className="text-sm text-ink-500">Sin resultados para “{q}”.</div>
          )}
          {filtered.map((e) => (
            <div key={e.id} className="rounded-2xl border border-ink-200 bg-white p-4">
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-medium">{e.name}</div>
                <div className="flex items-baseline gap-3">
                  <div className="text-xs text-ink-500">{new Date(e.createdAt).toLocaleString()}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null)
                      setConfirmingId(e.id)
                    }}
                    className="text-xs uppercase tracking-widest text-ink-400 hover:text-rose-600"
                    aria-label={`Eliminar la confirmación de ${e.name}`}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              {e.message && (
                <div className="mt-2">
                  {messageLabel && (
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                      {messageLabel}
                    </div>
                  )}
                  <div className="text-sm text-ink-700">{e.message}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {confirmingEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => {
            if (deleting) return
            setConfirmingId(null)
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-ink-200 bg-white p-6 anim-fade-in"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-ink-900">Eliminar confirmación</h2>
            <p className="mt-2 text-sm text-ink-700">
              ¿Eliminar la confirmación de <span className="font-medium">{confirmingEntry.name}</span>? Esta acción no se puede deshacer.
            </p>
            {deleteError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900">
                {deleteError}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingId(null)}
                disabled={deleting}
                className="text-sm uppercase tracking-widest text-ink-500 hover:text-ink-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-full bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
