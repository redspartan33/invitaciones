import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useAutoSave } from '../../hooks/useAutoSave'
import { CopyIcon, ShareIcon } from '../blocks/icons'

export function EditorHeader() {
  const title = useEditorStore((s) => s.invitation.title)
  const updateTitle = useEditorStore((s) => s.updateTitle)
  const resetDraft = useEditorStore((s) => s.resetDraft)
  const invitation = useEditorStore((s) => s.invitation)
  const { status, lastSavedAt } = useAutoSave()
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/?inv=${invitation.id}`

  const onShare = () => {
    setShareOpen(true)
  }
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-ink-200 bg-white px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-ink-900 text-xs font-bold text-white">D</div>
        <input
          type="text"
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          className="border-none bg-transparent text-base font-medium outline-none focus:bg-ink-50 px-2 py-1 rounded"
          placeholder="Nombre de la invitación"
        />
      </div>

      <div className="flex items-center gap-3 text-xs text-ink-500">
        <SaveIndicator status={status} lastSavedAt={lastSavedAt} />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => { if (confirm('¿Descartar borrador y empezar de cero?')) resetDraft() }} className="btn-ghost">
          Reiniciar
        </button>
        <button onClick={onShare} className="btn-flat">
          <ShareIcon className="h-4 w-4" /> Compartir
        </button>
        <button className="btn-primary">Publicar</button>
      </div>

      {shareOpen && (
        <div className="absolute right-6 top-14 z-30 w-96 rounded border border-ink-200 bg-white p-4 anim-fade-in">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium">Link público</h4>
            <button onClick={() => setShareOpen(false)} className="btn-ghost text-xs">Cerrar</button>
          </div>
          <p className="mb-3 text-xs text-ink-500">Comparte este link con tus invitados (demo, sin backend).</p>
          <div className="flex items-center gap-2">
            <input type="text" readOnly value={link} className="input-flat flex-1 text-xs" />
            <button onClick={onCopy} className="btn-flat" title="Copiar">
              <CopyIcon className="h-4 w-4" />
            </button>
          </div>
          {copied && <p className="mt-2 text-xs text-emerald-600">¡Link copiado!</p>}
        </div>
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
