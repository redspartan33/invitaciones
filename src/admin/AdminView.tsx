import { useEffect, useState } from 'react'
import { INVITATION_PREFIX, useEditorStore } from '../store/editorStore'
import type { Invitation } from '../types/invitation.types'
import { ADMIN_TOKEN } from './adminAuth'
import { listFromRegistry, deleteFromRegistry } from '../utils/inviteRegistry'

function StatusBadge({ status }: { status: 'draft' | 'published' | 'archived' }) {
  const map = {
    draft: { label: 'Borrador', cls: 'bg-ink-100 text-ink-600 border border-ink-200' },
    published: { label: 'Publicada', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    archived: { label: 'Archivada', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  } as const
  const v = map[status] || map.draft
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${v.cls}`}>
      {v.label}
    </span>
  )
}

interface DiagResult {
  env: Record<string, boolean>
  blob: { writeOk: boolean; readOk: boolean; error: string | null }
  summary: string
}

async function fetchDiag(): Promise<DiagResult | null> {
  try {
    const res = await fetch('/api/diag', { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as DiagResult
  } catch {
    return null
  }
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function AdminView({ onOpenEditor }: { onOpenEditor: (id?: string) => void }) {
  const [items, setItems] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [remoteUnavailable, setRemoteUnavailable] = useState(false)
  const [diag, setDiag] = useState<DiagResult | null>(null)
  const [diagLoading, setDiagLoading] = useState(true)
  const unpublish = useEditorStore((s) => s.unpublishInvitation)
  const loadInvitation = useEditorStore((s) => s.loadInvitation)

  const refresh = async () => {
    setLoading(true)
    const remote = await listFromRegistry()
    if (remote === null) {
      setRemoteUnavailable(true)
      setItems([])
    } else {
      setRemoteUnavailable(false)
      const seen = new Set<string>()
      const list: Invitation[] = []
      for (const inv of remote) {
        if (!inv?.id || seen.has(inv.id)) continue
        seen.add(inv.id)
        list.push(inv)
      }
      list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      setItems(list)
    }
    setLoading(false)
  }

  const refreshDiag = async () => {
    setDiagLoading(true)
    setDiag(await fetchDiag())
    setDiagLoading(false)
  }

  useEffect(() => {
    refresh()
    refreshDiag()
  }, [])

  const onDelete = async (inv: Invitation) => {
    if (!confirm(`¿Eliminar la invitación "${inv.title}"?`)) return
    if (inv.status === 'published') {
      loadInvitation(inv)
      await unpublish()
    } else if (inv.id) {
      await deleteFromRegistry(`draft-${inv.id}`)
    }
    window.localStorage.removeItem(INVITATION_PREFIX + inv.id)
    refresh()
  }

  const onEdit = (inv: Invitation) => {
    loadInvitation(inv)
    onOpenEditor(inv.id)
  }

  const onExport = () => {
    downloadJson(`invitations-${new Date().toISOString().slice(0, 10)}.json`, items)
  }

  const blobOk = !!diag?.blob?.writeOk && !!diag?.blob?.readOk
  const banner = diagLoading
    ? { text: 'Probando servidor…', cls: 'bg-ink-50 text-ink-500 border-ink-200' }
    : !diag
      ? { text: 'No se pudo contactar /api/diag', cls: 'bg-red-50 text-red-700 border-red-200' }
      : blobOk
        ? { text: '✓ Servidor conectado — las invitaciones se guardan en la base de datos', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
        : { text: `✗ Servidor no disponible: ${diag.summary}`, cls: 'bg-red-50 text-red-700 border-red-200' }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-200 bg-white px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400">Panel privado</p>
          <h1 className="font-serif text-2xl text-ink-900">Mis invitaciones</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            disabled={items.length === 0}
            className="rounded border border-ink-200 px-3 py-1.5 text-xs hover:border-ink-400 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Descarga el JSON con todas las invitaciones"
          >
            Exportar JSON
          </button>
          <button onClick={() => onOpenEditor()} className="btn-primary">
            + Nueva invitación
          </button>
        </div>
      </header>

      <div className={`border-b px-8 py-2.5 text-xs ${banner.cls}`}>
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
          <span>{banner.text}</span>
          <button onClick={refreshDiag} className="underline opacity-70 hover:opacity-100">
            Re-probar
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-8 py-10">
        {loading ? (
          <div className="rounded border border-ink-200 bg-white p-12 text-center">
            <p className="text-ink-400 text-sm animate-pulse">Cargando…</p>
          </div>
        ) : remoteUnavailable ? (
          <div className="rounded border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-serif text-xl text-red-900">No se pudo contactar el servidor</p>
            <p className="mt-3 text-sm text-red-700">
              Revisa el banner de arriba. Probablemente el Vercel Blob Store no esté conectado
              al proyecto (Storage → Blob → Connect to Project).
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded border border-dashed border-ink-300 bg-white p-12 text-center">
            <p className="font-serif text-2xl text-ink-900">Aún no hay invitaciones</p>
            <p className="mt-3 text-sm text-ink-500">Crea la primera y compártela con tus invitados.</p>
            <button onClick={() => onOpenEditor()} className="mt-6 btn-primary">
              Crear invitación
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((inv) => {
              const isPub = inv.status === 'published'
              const link = isPub ? `${window.location.origin}/?id=${inv.publicSlug || inv.id}` : ''
              return (
                <li key={inv.id} className="flex items-center justify-between rounded border border-ink-200 bg-white px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <p className="font-serif text-lg text-ink-900 truncate">{inv.title}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {inv.blocks.length} bloques · actualizada {new Date(inv.updatedAt).toLocaleString()}
                    </p>
                    {isPub ? (
                      <a href={link} target="_blank" rel="noreferrer" className="mt-1.5 inline-block text-xs text-ink-500 underline truncate max-w-md">
                        {link}
                      </a>
                    ) : (
                      <p className="mt-1.5 text-xs text-ink-400 italic">No publicada (en borrador)</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isPub && (
                      <button
                        onClick={() => navigator.clipboard.writeText(link)}
                        className="rounded border border-ink-200 px-3 py-1.5 text-xs hover:border-ink-400"
                      >
                        Copiar link
                      </button>
                    )}
                    <button onClick={() => onEdit(inv)} className="rounded border border-ink-200 px-3 py-1.5 text-xs hover:border-ink-400">
                      Editar
                    </button>
                    <button onClick={() => onDelete(inv)} className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:border-red-400">
                      Eliminar
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <p className="mt-10 text-center text-[10px] uppercase tracking-[0.2em] text-ink-300">
          Acceso privado · token {ADMIN_TOKEN.slice(0, 6)}…
        </p>
      </main>
    </div>
  )
}

export function ForbiddenView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 p-8 text-center">
      <div>
        <p className="font-serif text-5xl leading-none text-ink-900">Invitación no encontrada</p>
        <p className="mt-6 max-w-md text-sm text-ink-500">
          Es posible que el enlace haya expirado o que ya no esté publicado.
        </p>
      </div>
    </div>
  )
}
