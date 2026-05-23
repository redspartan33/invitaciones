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

  // 1. Cargar copias maestras/borradores
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

  // 2. Cargar publicadas antiguas para migración y retrocompatibilidad
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key || !key.startsWith(PUBLISHED_PREFIX)) continue
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const inv = JSON.parse(raw) as Invitation
        if (!seenIds.has(inv.id)) {
          // Guardar copia maestra automáticamente
          const masterKey = INVITATION_PREFIX + inv.id
          window.localStorage.setItem(masterKey, JSON.stringify(inv))
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

async function loadAllInvitations(): Promise<Invitation[]> {
  const seenIds = new Set<string>()
  const merged: Invitation[] = []

  // 1. Primary: fetch from remote (Vercel Blob via /api/invitations/index)
  const remote = await listFromRegistry()
  if (remote) {
    for (const inv of remote) {
      if (!inv?.id) continue
      // Skip draft blobs (they use the 'draft-' prefix internally and will
      // appear as normal invitations — just deduplicate by their real id).
      if (!seenIds.has(inv.id)) {
        seenIds.add(inv.id)
        merged.push(inv)
        // Keep localStorage in sync for offline use
        try {
          window.localStorage.setItem(INVITATION_PREFIX + inv.id, JSON.stringify(inv))
        } catch { /* ignore */ }
      }
    }
  }

  // 2. Fallback / supplement: local storage (works offline and during local dev)
  const local = loadLocalInvitations()
  for (const inv of local) {
    if (!seenIds.has(inv.id)) {
      seenIds.add(inv.id)
      merged.push(inv)
    }
  }

  return merged.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
}

export function AdminView({ onOpenEditor }: { onOpenEditor: (id?: string) => void }) {
  const [items, setItems] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const unpublish = useEditorStore((s) => s.unpublishInvitation)
  const loadInvitation = useEditorStore((s) => s.loadInvitation)

  const refresh = () => {
    setLoading(true)
    loadAllInvitations().then((list) => {
      setItems(list)
      setLoading(false)
    })
  }
  useEffect(() => {
    refresh()
  }, [])

  const onDelete = async (inv: Invitation) => {
    if (!confirm(`¿Eliminar la invitación "${inv.title}"?`)) return
    
    // Si estaba publicada, despublicarla del backend
    if (inv.status === 'published') {
      loadInvitation(inv)
      await unpublish()
    } else if (inv.id) {
      // Borrador: eliminar del servidor también
      await deleteFromRegistry(`draft-${inv.id}`)
    }
    
    // Eliminar claves locales
    window.localStorage.removeItem(INVITATION_PREFIX + inv.id)
    window.localStorage.removeItem(PUBLISHED_PREFIX + (inv.publicSlug || inv.id))
    refresh()
  }

  const onEdit = (inv: Invitation) => {
    loadInvitation(inv)
    onOpenEditor(inv.id)
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-200 bg-white px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400">Panel privado</p>
          <h1 className="font-serif text-2xl text-ink-900">Mis invitaciones</h1>
        </div>
        <button onClick={() => onOpenEditor()} className="btn-primary">
          + Nueva invitación
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-10">
        {loading ? (
          <div className="rounded border border-ink-200 bg-white p-12 text-center">
            <p className="text-ink-400 text-sm animate-pulse">Cargando invitaciones…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded border border-dashed border-ink-300 bg-white p-12 text-center">
            <p className="text-ink-500">Aún no has creado ninguna invitación.</p>
            <button onClick={() => onOpenEditor()} className="mt-4 btn-primary">
              Crear la primera
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((inv) => {
              const isPub = inv.status === 'published'
              const link = isPub ? `${window.location.origin}/?inv=${inv.publicSlug || inv.id}` : ''
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
                        onClick={() => {
                          navigator.clipboard.writeText(link)
                        }}
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
          Es posible que el enlace haya expirado o que aún no esté publicado.
          Pídele al organizador un link actualizado.
        </p>
      </div>
    </div>
  )
}
