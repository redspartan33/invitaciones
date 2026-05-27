import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useAutoSave } from '../../hooks/useAutoSave'
import { CopyIcon, ShareIcon } from '../blocks/icons'
import { ADMIN_TOKEN } from '../../admin/adminAuth'
import { apiUrl } from '../../utils/apiBase'

export function EditorHeader() {
  const title = useEditorStore((s) => s.invitation.title)
  const status = useEditorStore((s) => s.invitation.status)
  const updateTitle = useEditorStore((s) => s.updateTitle)
  const resetDraft = useEditorStore((s) => s.resetDraft)
  const publishInvitation = useEditorStore((s) => s.publishInvitation)
  const unpublishInvitation = useEditorStore((s) => s.unpublishInvitation)
  const invitation = useEditorStore((s) => s.invitation)
  const publishMode = useEditorStore((s) => s.publishMode)
  const publishError = useEditorStore((s) => s.publishError)
  const { status: saveStatus, lastSavedAt } = useAutoSave()
  const [shareOpen, setShareOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [justPublished, setJustPublished] = useState(false)

  const isPublished = status === 'published'
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  // The shareable URL points at the API's /share/<slug> endpoint, which
  // serves an HTML page carrying og:title / og:image / og:description
  // tags so WhatsApp / iMessage / Twitter can render a link preview card.
  // Clicking the link redirects the human to the SPA on the frontend
  // origin (target encoded inside /share's <meta http-equiv="refresh">).
  // In dev the apiUrl() base is empty, so we fall back to a same-origin
  // path which the Vite proxy forwards to the local Express server.
  //
  // We deliberately ignore invitation.sharedLink even when set: older
  // records were published with the previous "<origin>/?id=<slug>" format
  // which gives no link preview, and we always want the current /share/
  // form here.
  const shareSlug = invitation.publicSlug
  const shareLink = shareSlug
    ? apiUrl(`/share/${shareSlug}`) || `${origin}/share/${shareSlug}`
    : ''
  const qrSrc = shareLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(shareLink)}`
    : ''

  const onPublish = async () => {
    const link = await publishInvitation()
    setShareOpen(true)
    if (link) {
      setJustPublished(true)
      setTimeout(() => setJustPublished(false), 2500)
    }
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

  const [updating, setUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const onBackToAdmin = () => {
    window.history.pushState({}, '', `/?admin=${ADMIN_TOKEN}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const onUpdatePublish = async () => {
    setUpdating(true)
    setUpdateSuccess(false)
    try {
      await publishInvitation()
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <header className="relative flex flex-wrap items-center justify-between gap-y-2 border-b border-ink-200 bg-white px-3 py-2 md:flex-nowrap md:gap-y-0 md:px-6 md:py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
        <button
          onClick={onBackToAdmin}
          className="btn-ghost flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-ink-100 rounded text-ink-600 transition-colors"
          title="Volver al panel"
        >
          ← <span className="hidden sm:inline">Volver</span>
        </button>
        <span className="hidden h-5 w-px bg-ink-200 md:inline-block" />
        <div className="hidden h-7 w-7 items-center justify-center rounded bg-ink-900 text-xs font-bold text-white md:flex">D</div>
        <input
          type="text"
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          className="min-w-0 flex-1 border-none bg-transparent text-sm font-medium outline-none focus:bg-ink-50 px-1.5 py-1 rounded md:flex-initial md:text-base md:px-2"
          placeholder="Nombre de la invitación"
        />
        <StatusBadge status={status} />
      </div>

      <div className="hidden items-center gap-3 text-xs text-ink-500 md:flex">
        <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          onClick={() => {
            if (confirm('¿Descartar borrador y empezar de cero?')) resetDraft()
          }}
          className="btn-ghost hidden md:inline-flex"
        >
          Reiniciar
        </button>
        <button
          onClick={() => setShareOpen(true)}
          className="btn-flat px-2 md:px-3"
          disabled={!isPublished}
          title={isPublished ? 'Compartir link' : 'Publica primero para compartir'}
        >
          <ShareIcon className="h-4 w-4" /> <span className="hidden md:inline">Compartir</span>
        </button>
        {isPublished ? (
          <>
            <button
              onClick={onUpdatePublish}
              disabled={updating}
              className={`btn-primary flex items-center gap-1.5 transition-all ${
                updateSuccess ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
              }`}
            >
              {updating ? (
                <>
                  <span className="animate-spin inline-block">⏳</span> <span className="hidden md:inline">Guardando…</span>
                </>
              ) : updateSuccess ? (
                <>
                  <span>✓</span> <span className="hidden md:inline">¡Guardado!</span>
                </>
              ) : (
                <><span className="hidden md:inline">Guardar cambios</span><span className="md:hidden">Guardar</span></>
              )}
            </button>
            <button
              onClick={() => { if (confirm('¿Despublicar invitación?')) void unpublishInvitation() }}
              className="btn-flat hidden md:inline-flex"
            >
              Despublicar
            </button>
          </>
        ) : (
          <button onClick={onPublish} className="btn-primary">
            Publicar
          </button>
        )}
      </div>

      {shareOpen && (
        <>
          {/* The ConfigPanel side drawer renders at z-40 on mobile, so the
              share helper has to sit above it (z-50 backdrop, z-[60] panel)
              — otherwise the share UI ends up half-hidden behind the sidebar
              every time the user opens it from the device frame. */}
          <div className="fixed inset-0 z-50" onClick={() => setShareOpen(false)} />
          <div className="fixed right-3 left-3 top-14 z-[60] max-h-[calc(100vh-5rem)] overflow-y-auto rounded border border-ink-200 bg-white p-4 anim-fade-in md:left-auto md:right-6 md:w-[420px]">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {publishMode === 'error'
                  ? 'No se pudo publicar'
                  : isPublished
                    ? 'Invitación publicada'
                    : 'Aún no publicada'}
              </h4>
              <button onClick={() => setShareOpen(false)} className="btn-ghost text-xs">
                Cerrar
              </button>
            </div>
            {publishMode === 'pushing' && (
              <p className="mb-3 rounded border border-ink-200 bg-ink-50 px-3 py-2 text-xs text-ink-600">
                Guardando en el servidor…
              </p>
            )}
            {publishMode === 'error' && (
              <p className="mb-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {publishError ?? 'Error desconocido.'} Vuelve a intentar.
              </p>
            )}
            {justPublished && (
              <p className="mb-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                ¡Invitación publicada! Comparte el link con tus invitados.
              </p>
            )}
            <label className="label-flat">Enlace de la invitación</label>
            <div className="mb-3 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareLink || '—'}
                className="input-flat flex-1 text-xs font-mono"
              />
              <button
                onClick={() => onCopy(shareLink, 'simple')}
                className="btn-flat"
                title="Copiar"
                disabled={!shareLink}
              >
                <CopyIcon className="h-4 w-4" />
              </button>
            </div>
            {copiedField === 'simple' && <p className="mb-3 text-xs text-emerald-600">¡Copiado!</p>}

            {qrSrc && (
              <div className="mt-4 rounded border border-ink-200 bg-ink-50 p-4">
                <label className="label-flat">Código QR</label>
                <div className="flex items-center gap-4">
                  <img
                    src={qrSrc}
                    alt="Código QR de la invitación"
                    width={160}
                    height={160}
                    className="rounded border border-ink-200 bg-white"
                  />
                  <div className="flex-1 space-y-2">
                    <p className="text-[11px] text-ink-500">
                      Escanea para abrir la invitación, o descarga el QR para imprimirlo.
                    </p>
                    <a
                      href={qrSrc}
                      download={`qr-${invitation.publicSlug || invitation.id}.png`}
                      className="btn-flat w-full justify-center text-xs"
                    >
                      Descargar QR
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <a href={shareLink} target="_blank" rel="noreferrer" className="btn-flat flex-1 justify-center">
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
