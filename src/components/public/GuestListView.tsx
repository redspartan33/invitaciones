import { useEffect, useMemo, useState } from 'react'

export function GuestListView({ slug }: { slug: string }) {
  const [entries, setEntries] = useState<{ id: string; name: string; message?: string; createdAt: string }[] | undefined>(undefined)
  const [q, setQ] = useState('')

  const loadEntries = async () => {
    setEntries(undefined)
    try {
      const res = await fetch(`/api/guestlists/${slug}`)
      if (!res.ok) {
        setEntries([])
        return
      }
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch {
      setEntries([])
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
                <div className="text-xs text-ink-500">{new Date(e.createdAt).toLocaleString()}</div>
              </div>
              {e.message && <div className="mt-2 text-sm text-ink-700">{e.message}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
