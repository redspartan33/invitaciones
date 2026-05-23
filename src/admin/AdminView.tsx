import { useEffect, useState } from 'react'
import { INVITATION_PREFIX, PUBLISHED_PREFIX, useEditorStore } from '../store/editorStore'
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

function loadLocalInvitations(): Invitation[] {
  const list: Invitation[] = []
  const seenIds = new Set<string>()

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key || !key.startsWith(INVITATION_PREFIX)) continue
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const inv = JSON.parse(raw) as Invitation
        list.push(inv)
        seenIds.add(inv.id)
      }
    } catch {
      /* ignore */
    }
  }

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key || !key.startsWith(PUBLISHED_PREFIX)) continue
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const inv = JSON.parse(raw) as Invitation
        if (!seenIds.has(inv.id)) {
          list.push(inv)
          seenIds.add(inv.id)
        }
      }
    } catch {
      /* ignore */
    }
  }

  return list
}

interface DiagResult {
  env: Record<string, boolean>
  kv: { writeOk: boolean; readOk: boolean; error: string | null }
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

async function importLocalToRemote(): Promise<{ total: number; imported: number; failed: unknown[] } | { error: string }> {
  const local = loadLocalInvitations()
  if (local.length === 0) return { total: 0, imported: 0, failed: [] }
  try {
    const res = await fetch(`/api/import-bulk?admin=${ADMIN_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitations: local }),
    })
    if (!res.ok) return { error: `HTTP ${res.status}` }
    return await res.json()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'unknown' }
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
  const [diag, setDiag] = useState<DiagResult | null>(null)
  const [diagLoading, setDiagLoading] = useState(true)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [remoteUnavailable, setRemoteUnavailable] = useState(false)
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
      // Deduplicar por id, ordenar por updatedAt desc
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
    if (!confirm(`¿Eliminar la invitación "${inv.title}" de la base de datos?`)) return
    if (inv.status === 'published') {
      loadInvitation(inv)
      await unpublish()
    } else if (inv.id) {
      await deleteFromRegistry(`draft-${inv.id}`)
    }
    window.localStorage.removeItem(INVITATION_PREFIX + inv.id)
    window.localStorage.removeItem(PUBLISHED_PREFIX + (inv.publicSlug || inv.id))
    refresh()
  }

  const onEdit = (inv: Invitation) => {
    loadInvitation(inv)
    onOpenEditor(inv.id)
  }

  const onExport = () => {
    downloadJson(`invitations-kv-${new Date().toISOString().slice(0, 10)}.json`, items)
  }

  const onImport = async () => {
    const localCount = loadLocalInvitations().length
    if (localCount === 0) {
      setStatusMsg('No hay invitaciones en este navegador para subir.')
      setTimeout(() => setStatusMsg(null), 4000)
      return
    }
    setStatusMsg(`Subiendo ${localCount} invitaciones del navegador a KV…`)
    const result = await importLocalToRemote()
    if ('error' in result) {
      setStatusMsg(`Error: ${result.error}`)
    } else {
      setStatusMsg(`✓ ${result.imported}/${result.total} importadas a la base de datos`)
      refresh()
    }
    setTimeout(() => setStatusMsg(null), 5000)
  }

  // Render diagnóstico
  const kvConnected = !!diag?.kv?.writeOk && !!diag?.kv?.readOk
  const kvLabel = diagLoading
    ? 'Probando KV…'
    : !diag
      ? 'No se pudo contactar /api/diag'
      : kvConnected
        ? '✓ Base de datos KV conectada y funcionando'
        : `✗ KV no funciona: ${diag.summary}`
  const kvCls = diagLoading
    ? 'bg-ink-50 text-ink-500 border-ink-200'
    : kvConnected
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-red-50 text-red-700 border-red-200'

  const localCount = loadLocalInvitations().length

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-200 bg-white px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400">Panel privado</p>
          <h1 className="font-serif text-2xl text-ink-900">Invitaciones en la base de datos</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            disabled={items.length === 0}
            className="rounded border border-ink-200 px-3 py-1.5 text-xs hover:border-ink-400 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Descarga el JSON con todo lo que hay en KV"
          >
            Exportar JSON
          </button>
          <button
            onClick={onImport}
            className="rounded border border-ink-200 px-3 py-1.5 text-xs hover:border-ink-400"
            title={`Sube las ${localCount} invitaciones de este navegador al backend KV`}
          >
            Importar localStorage → KV {localCount > 0 ? `(${localCount})` : ''}
          </button>
          <button onClick={() => onOpenEditor()} className="btn-primary">
            + Nueva invitación
          </button>
        </div>
      </header>

      <div className={`border-b px-8 py-2.5 text-xs ${kvCls}`}>
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
          <span>{kvLabel}</span>
          <button onClick={refreshDiag} className="underline opacity-70 hover:opacity-100">
            Re-probar
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="border-b border-ink-200 bg-ink-50 px-8 py-2 text-center text-xs text-ink-700">
          {statusMsg}
        </div>
      )}

      <main className="mx-auto max-w-5xl px-8 py-10">
        {loading ? (
          <div className="rounded border border-ink-200 bg-white p-12 text-center">
            <p className="text-ink-400 text-sm animate-pulse">Cargando desde la base de datos…</p>
          </div>
        ) : remoteUnavailable ? (
          <div className="rounded border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-serif text-xl text-red-900">No se pudo contactar la base de datos</p>
            <p className="mt-3 text-sm text-red-700">
              El endpoint <code>/api/invitations/index</code> no respondió. Revisa el banner de arriba
              y la conexión KV en Vercel → Storage.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded border border-dashed border-ink-300 bg-white p-12 text-center">
            <p className="font-serif text-2xl text-ink-900">La base de datos está vacía</p>
            <p className="mt-3 text-sm text-ink-500">
              No hay ninguna invitación guardada en KV todavía.
            </p>
            {localCount > 0 && (
              <p className="mt-2 text-sm text-ink-700">
                Tienes <strong>{localCount}</strong> invitaciones solo en este navegador (localStorage).
                Usa el botón <strong>Importar localStorage → KV</strong> de arriba para subirlas.
              </p>
            )}
            <button onClick={() => onOpenEditor()} className="mt-6 btn-primary">
              Crear una nueva
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between text-xs text-ink-500">
              <span>
                {items.length} {items.length === 1 ? 'invitación' : 'invitaciones'} en la base de datos
              </span>
              {localCount > items.length && (
                <span className="text-amber-700">
                  ⚠ {localCount - items.length} adicionales solo en este navegador — usa "Importar"
                </span>
              )}
            </div>
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
          </>
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
          Este link apunta a un slug que no existe en la base de datos.
          Si acabas de migrar a KV, abre el panel admin y usa el botón
          <strong> "Importar localStorage → KV"</strong> para subir las invitaciones
          que tenías guardadas en tu navegador.
        </p>
      </div>
    </div>
  )
}
