import { useEffect, useMemo, useState } from 'react'
import { INVITATION_PREFIX, useEditorStore } from '../store/editorStore'
import type { Invitation, InvitationKind } from '../types/invitation.types'
import { ADMIN_TOKEN } from './adminAuth'
import { listFromRegistry, deleteFromRegistry } from '../utils/inviteRegistry'
import { apiUrl } from '../utils/apiBase'

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

// Normalized result the UI consumes. Older deploys returned a Vercel-Blob-
// shaped payload ({ blob: { writeOk, readOk, error } }); the current Express
// server returns the same fields at the top level. We accept both.
interface DiagResult {
  blob: { writeOk: boolean; readOk: boolean; error: string | null }
  summary: string
}

async function fetchDiag(): Promise<DiagResult | null> {
  try {
    const res = await fetch(apiUrl('/api/diag'), { cache: 'no-store' })
    if (!res.ok) return null
    const raw = (await res.json()) as Record<string, unknown>
    const blob = (raw.blob ?? {
      writeOk: !!raw.writeOk,
      readOk: !!raw.readOk,
      error: (raw.error as string | null) ?? null,
    }) as DiagResult['blob']
    const summary = typeof raw.summary === 'string'
      ? raw.summary
      : blob.error ?? (blob.writeOk && blob.readOk ? 'OK' : 'fallo de almacenamiento')
    return { blob, summary }
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

function inferKind(inv: Invitation): InvitationKind {
  if (inv.kind === 'menu' || inv.kind === 'invitation') return inv.kind
  // Older records without `kind`: infer from block types.
  return inv.blocks.some((b) => b.type.startsWith('menu-')) ? 'menu' : 'invitation'
}

type AdminFilter = 'all' | 'invitation' | 'menu'

export function AdminView({ onOpenEditor }: { onOpenEditor: (id?: string, kind?: InvitationKind) => void }) {
  const [items, setItems] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [remoteUnavailable, setRemoteUnavailable] = useState(false)
  const [diag, setDiag] = useState<DiagResult | null>(null)
  const [diagLoading, setDiagLoading] = useState(true)
  const [filter, setFilter] = useState<AdminFilter>('all')
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
    onOpenEditor(inv.id, inferKind(inv))
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((i) => inferKind(i) === filter)
  }, [items, filter])

  const counts = useMemo(() => {
    let menu = 0
    let invitation = 0
    for (const i of items) {
      if (inferKind(i) === 'menu') menu++
      else invitation++
    }
    return { all: items.length, menu, invitation }
  }, [items])

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
      <header className="border-b border-ink-200 bg-white px-4 py-3 md:px-8 md:py-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400">Panel privado</p>
            <h1 className="font-serif text-xl md:text-2xl text-ink-900">Mis documentos</h1>
          </div>
          {/* On mobile the two "Nuevo" buttons take equal width so they're
              easy to tap; Exportar JSON drops to a small text link below the
              row to avoid crowding the primary actions. */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenEditor(undefined, 'invitation')}
                className="btn-primary flex-1 justify-center md:flex-initial"
              >
                + Invitación
              </button>
              <button
                onClick={() => onOpenEditor(undefined, 'menu')}
                className="flex-1 justify-center rounded border border-ink-900 bg-white px-3 py-2 text-xs font-medium text-ink-900 hover:bg-ink-50 md:flex-initial md:py-1.5"
              >
                + Menú
              </button>
            </div>
            <button
              onClick={onExport}
              disabled={items.length === 0}
              className="self-end text-[11px] uppercase tracking-widest text-ink-500 hover:text-ink-900 disabled:opacity-40 disabled:cursor-not-allowed md:self-auto md:rounded md:border md:border-ink-200 md:px-3 md:py-1.5 md:text-xs md:tracking-normal md:hover:border-ink-400"
              title="Descarga el JSON con todo"
            >
              Exportar JSON
            </button>
          </div>
        </div>
      </header>

      <div className={`border-b px-4 md:px-8 py-2 text-[11px] md:text-xs ${banner.cls}`}>
        <div className="mx-auto max-w-5xl flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="truncate">{banner.text}</span>
          <button onClick={refreshDiag} className="underline opacity-70 hover:opacity-100 self-start sm:self-auto">
            Re-probar
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 md:px-8 py-6 md:py-10">
        {!loading && !remoteUnavailable && items.length > 0 && (
          <div className="mb-5 flex items-center gap-1 rounded border border-ink-200 bg-white p-0.5 w-fit">
            {(
              [
                { id: 'all' as AdminFilter, label: `Todos (${counts.all})` },
                { id: 'invitation' as AdminFilter, label: `Invitaciones (${counts.invitation})` },
                { id: 'menu' as AdminFilter, label: `Menús (${counts.menu})` },
              ]
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded px-3 py-1.5 text-xs transition-colors ${
                  filter === f.id ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

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
            <p className="font-serif text-2xl text-ink-900">Aún no hay nada</p>
            <p className="mt-3 text-sm text-ink-500">Crea tu primera invitación o menú.</p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <button onClick={() => onOpenEditor(undefined, 'menu')} className="rounded border border-ink-900 bg-white px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-ink-50">
                Crear menú
              </button>
              <button onClick={() => onOpenEditor(undefined, 'invitation')} className="btn-primary">
                Crear invitación
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded border border-dashed border-ink-300 bg-white p-12 text-center">
            <p className="text-sm text-ink-500">No hay {filter === 'menu' ? 'menús' : 'invitaciones'} aún.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((inv) => {
              const isPub = inv.status === 'published'
              const link = isPub ? `${window.location.origin}/?id=${inv.publicSlug || inv.id}` : ''
              const kind = inferKind(inv)
              return (
                <li
                  key={inv.id}
                  className="flex flex-col gap-3 rounded border border-ink-200 bg-white p-3 md:flex-row md:items-center md:justify-between md:px-5 md:py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <KindBadge kind={kind} />
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="mt-1.5 font-serif text-base text-ink-900 md:text-lg truncate">
                      {inv.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      {inv.blocks.length} bloques · {new Date(inv.updatedAt).toLocaleDateString()}{' '}
                      {new Date(inv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {isPub ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block break-all text-[11px] text-ink-500 underline md:max-w-md md:truncate md:break-normal"
                      >
                        {link}
                      </a>
                    ) : (
                      <p className="mt-1 text-[11px] italic text-ink-400">No publicada (en borrador)</p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 md:flex md:shrink-0 md:items-center">
                    {isPub ? (
                      <button
                        onClick={() => navigator.clipboard.writeText(link)}
                        className="rounded border border-ink-200 px-2 py-2 text-xs hover:border-ink-400 md:px-3 md:py-1.5"
                      >
                        Copiar
                      </button>
                    ) : (
                      <span className="rounded border border-transparent px-2 py-2 text-xs text-transparent md:hidden">·</span>
                    )}
                    <button
                      onClick={() => onEdit(inv)}
                      className="rounded border border-ink-200 px-2 py-2 text-xs font-medium hover:border-ink-400 md:px-3 md:py-1.5"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(inv)}
                      className="rounded border border-red-200 px-2 py-2 text-xs text-red-600 hover:border-red-400 md:px-3 md:py-1.5"
                    >
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

function KindBadge({ kind }: { kind: InvitationKind }) {
  if (kind === 'menu') {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-emerald-700">
        Menú
      </span>
    )
  }
  return (
    <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-violet-700">
      Invitación
    </span>
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
