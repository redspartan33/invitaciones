import { useEffect, useState } from 'react'
import { PUBLISHED_PREFIX, useEditorStore } from '../store/editorStore'
import type { Invitation } from '../types/invitation.types'
import { ADMIN_TOKEN } from './adminAuth'

function loadAllPublished(): Invitation[] {
  const list: Invitation[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key || !key.startsWith(PUBLISHED_PREFIX)) continue
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) list.push(JSON.parse(raw) as Invitation)
    } catch {
      /* ignore */
    }
  }
  return list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
}

export function AdminView({ onOpenEditor }: { onOpenEditor: (id?: string) => void }) {
  const [items, setItems] = useState<Invitation[]>([])
  const unpublish = useEditorStore((s) => s.unpublishInvitation)
  const loadInvitation = useEditorStore((s) => s.loadInvitation)

  const refresh = () => setItems(loadAllPublished())
  useEffect(() => {
    refresh()
  }, [])

  const onDelete = async (inv: Invitation) => {
    if (!confirm(`¿Eliminar la invitación "${inv.title}"?`)) return
    loadInvitation(inv)
    await unpublish()
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
        {items.length === 0 ? (
          <div className="rounded border border-dashed border-ink-300 bg-white p-12 text-center">
            <p className="text-ink-500">Aún no has publicado ninguna invitación.</p>
            <button onClick={() => onOpenEditor()} className="mt-4 btn-primary">
              Crear la primera
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((inv) => {
              const link = `${window.location.origin}/?inv=${inv.publicSlug || inv.id}`
              return (
                <li key={inv.id} className="flex items-center justify-between rounded border border-ink-200 bg-white px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-serif text-lg text-ink-900 truncate">{inv.title}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {inv.blocks.length} bloques · actualizada {new Date(inv.updatedAt).toLocaleString()}
                    </p>
                    <a href={link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-ink-500 underline truncate max-w-md">
                      {link}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(link)
                      }}
                      className="rounded border border-ink-200 px-3 py-1.5 text-xs hover:border-ink-400"
                    >
                      Copiar link
                    </button>
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
        <p className="font-serif text-[120px] leading-none text-ink-900">403</p>
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-ink-500">Acceso denegado</p>
        <p className="mt-6 max-w-sm text-xs text-ink-400">
          Esta página no existe o no tienes permiso para verla.
        </p>
      </div>
    </div>
  )
}
