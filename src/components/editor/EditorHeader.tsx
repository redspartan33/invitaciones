import { useState } from 'react'
import { encodeInvitation, useEditorStore } from '../../store/editorStore'
import { useAutoSave } from '../../hooks/useAutoSave'
import { CopyIcon, ShareIcon } from '../blocks/icons'

export function EditorHeader() {
  const title = useEditorStore((s) => s.invitation.title)
  const status = useEditorStore((s) => s.invitation.status)
  const updateTitle = useEditorStore((s) => s.updateTitle)
  const resetDraft = useEditorStore((s) => s.resetDraft)
  const publishInvitation = useEditorStore((s) => s.publishInvitation)
  const unpublishInvitation = useEditorStore((s) => s.unpublishInvitation)
  const invitation = useEditorStore((s) => s.invitation)
  const { status: saveStatus, lastSavedAt } = useAutoSave()
  const [shareOpen, setShareOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [justPublished, setJustPublished] = useState(false)

  const isPublished = status === 'published'
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const simpleLink = `${origin}/?inv=${invitation.id}`
  const portableLink = `${origin}/?inv=${invitation.id}#data=${encodeInvitation(invitation)}`

  const onPublish = () => {
    publishInvitation()
    setJustPublished(true)
    setShareOpen(true)
    setTimeout(() => setJustPublished(false), 2500)
  }

  const onCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <header className="relative flex items-center justify-between border-b border-ink-200 bg-white px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-ink-900 text-xs font-bold text-white">D</div>
        <input
          type="text"
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          className="border-none bg-transparent text-base font-medium outline-none focus:bg-ink-50 px-2 py-1 rounded"
          placeholder="Nombre de la invitación"
        />
        <StatusBadge status={status} />
      </div>

      <div className="flex items-center gap-3 text-xs text-ink-500">
        <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (confirm('¿Descartar borrador y empezar de cero?')) resetDraft()
          }}
          className="btn-ghost"
        >
          Reiniciar
        </button>
        <button onClick={() => setShareOpen(true)} className="btn-flat" disabled={!isPublished} title={isPublished ? 'Compartir link' : 'Publica primero para compartir'}>
          <ShareIcon className="h-4 w-4" /> Compartir
        </button>
        {isPublished ? (
          <button onClick={() => { if (confirm('¿Despublicar invitación?')) unpublishInvitation() }} className="btn-flat">
            Despublicar
          </button>
        ) : (
          <button onClick={onPublish} className="btn-primary">
            Publicar
          </button>
        )}
      </div>

      {shareOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setShareOpen(false)} />
          <div className="absolute right-6 top-14 z-30 w-[420px] rounded border border-ink-200 bg-white p-4 anim-fade-in">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {isPublished ? 'Invitación publicada' : 'Aún no publicada'}
              </h4>
              <button onClick={() => setShareOpen(false)} className="btn-ghost text-xs">
                Cerrar
              </button>
            </div>
            {justPublished && (
              <p className="mb-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                ¡Invitación publicada! Comparte el link con tus invitados.
              </p>
            )}
            <p className="mb-3 text-xs text-ink-500">
              El primer link sólo funciona en este navegador. El segundo lleva toda la invitación
              embebida y funciona en cualquier dispositivo.
            </p>

            <label className="label-flat">Link privado</label>
            <div className="mb-3 flex items-center gap-2">
              <input type="text" readOnly value={simpleLink} className="input-flat flex-1 text-xs font-mono" />
              <button onClick={() => onCopy(simpleLink, 'simple')} className="btn-flat" title="Copiar">
                <CopyIcon className="h-4 w-4" />
              </button>
            </div>
            {copiedField === 'simple' && <p className="mb-3 text-xs text-emerald-600">¡Copiado!</p>}

            <label className="label-flat">Link portable (recomendado)</label>
            <div className="flex items-center gap-2">
              <input type="text" readOnly value={portableLink} className="input-flat flex-1 text-xs font-mono" />
              <button onClick={() => onCopy(portableLink, 'portable')} className="btn-flat" title="Copiar">
                <CopyIcon className="h-4 w-4" />
              </button>
            </div>
            {copiedField === 'portable' && <p className="mt-2 text-xs text-emerald-600">¡Copiado!</p>}

            <div className="mt-4 flex items-center gap-2">
              <a href={portableLink} target="_blank" rel="noreferrer" className="btn-flat flex-1 justify-center">
                Abrir vista pública ↗
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  )
}

function SaveIndicator({ status, lastSavedAt }: { status: 'idle' | 'saving' | 'saved'; lastSavedAt: Date | null }) {
  if (status === 'saving') return <span>Guardando…</span>
  if (status === 'saved') return <span className="text-emerald-600">Guardado ✓</span>
  if (lastSavedAt) return <span>Guardado {lastSavedAt.toLocaleTimeString()}</span>
  return <span>Auto-guardado activo</span>
}

function StatusBadge({ status }: { status: 'draft' | 'published' | 'archived' }) {
  const map = {
    draft: { label: 'Borrador', cls: 'bg-ink-100 text-ink-600' },
    published: { label: 'Publicada', cls: 'bg-emerald-100 text-emerald-700' },
    archived: { label: 'Archivada', cls: 'bg-amber-100 text-amber-700' },
  } as const
  const v = map[status]
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest ${v.cls}`}>{v.label}</span>
}
