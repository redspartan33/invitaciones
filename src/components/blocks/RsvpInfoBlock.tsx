import { useEffect, useState } from 'react'
import type { InvitationBlock, RsvpInfoData } from '../../types/invitation.types'
import { formatDate } from '../../utils/blockValidation'
import { getSubmittedName, hasSubmitted, submitGuestEntry } from '../../utils/guestlistClient'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

/**
 * Build a wa.me deep-link. WhatsApp expects the phone number as digits only
 * (E.164 format without "+"), and the text URL-encoded.
 * See https://faq.whatsapp.com/5913398998672934 for the canonical format.
 */
function buildWhatsAppUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '')
  const base = `https://wa.me/${digits}`
  if (!message?.trim()) return base
  return `${base}?text=${encodeURIComponent(message)}`
}

export function RsvpInfoBlock({ block }: { block: InvitationBlock<'rsvp-info'> }) {
  const data = block.data as RsvpInfoData
  const whatsappUrl = data.whatsappPhone?.trim()
    ? buildWhatsAppUrl(data.whatsappPhone, data.whatsappMessage)
    : ''
  const buttonLabel = data.whatsappButtonLabel?.trim() || 'Confirmar asistencia'
  const [showForm, setShowForm] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestMessage, setGuestMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedOk, setSubmittedOk] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const getGuestListSlug = () => {
    if (data.guestListSlug) return data.guestListSlug
    try {
      const link = data.guestListLink
      if (link) {
        const url = new URL(link, window.location.origin)
        return url.searchParams.get('guestlist') || undefined
      }
      if (typeof window !== 'undefined') {
        return new URL(window.location.href).searchParams.get('guestlist') || undefined
      }
    } catch {
      return undefined
    }
    return undefined
  }
  const guestListSlug = getGuestListSlug()
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (!guestListSlug) return
    setAlreadySubmitted(hasSubmitted(guestListSlug))
    setSubmittedName(getSubmittedName(guestListSlug))
  }, [guestListSlug])
  const isEditorView = typeof window !== 'undefined' && new URL(window.location.href).searchParams.has('admin')
  // In the editor we always show the controls so the designer can preview the
  // flow; only the public published view enforces the one-confirmation lock.
  const locked = alreadySubmitted && !isEditorView
  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        <TextEl block={block} field="heading" as="h2" className="font-serif text-3xl">
          Confirma tu asistencia
        </TextEl>
        {data.instructions && (
          <TextEl block={block} field="instructions" as="p" className="mx-auto mt-3 max-w-md text-sm opacity-80">
            {data.instructions}
          </TextEl>
        )}
        {data.deadline && (
          <TextEl block={block} field="deadline" as="p" className="mt-4 text-sm">
            Fecha límite: <span className="font-medium">{formatDate(data.deadline, 'DD MMMM YYYY')}</span>
          </TextEl>
        )}
        <div className="mt-6 flex flex-col items-center gap-2 text-sm opacity-80">
          {data.contactEmail && (
            <TextEl block={block} field="contactEmail">✉ {data.contactEmail}</TextEl>
          )}
          {data.contactPhone && (
            <TextEl block={block} field="contactPhone">☏ {data.contactPhone}</TextEl>
          )}
        </div>
        {data.useRsvpForm ? (
          <div className="mt-6 space-y-4">
            {locked && (
              <div className="mx-auto mt-4 max-w-lg rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="font-medium">
                  {submittedName ? `¡Gracias, ${submittedName}!` : '¡Gracias!'} Tu confirmación quedó registrada.
                </p>
                <p className="mt-1 text-xs opacity-80">
                  Solo se permite una confirmación por dispositivo.
                </p>
              </div>
            )}
            {!locked && !showForm && !submittedOk && (
              <button
                type="button"
                onClick={() => {
                  setSubmittedOk(false)
                  setSubmitError(null)
                  setShowForm(true)
                }}
                className="invitation-btn"
              >
                {buttonLabel}
              </button>
            )}
            {!locked && submittedOk && !showForm && (
              <div className="mx-auto mt-4 max-w-lg rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="font-medium">¡Gracias! Tu confirmación quedó registrada.</p>
              </div>
            )}
            {!locked && submitError && !showForm && (
              <div className="mx-auto mt-4 max-w-lg rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {submitError}
                <button
                  type="button"
                  onClick={() => {
                    setSubmitError(null)
                    setShowForm(true)
                  }}
                  className="ml-2 text-xs uppercase tracking-widest underline"
                >
                  Reintentar
                </button>
              </div>
            )}
            {!locked && showForm && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (submitting) return
                  if (!guestListSlug) {
                    setSubmitError('No se pudo identificar la lista de invitados de esta invitación.')
                    setShowForm(false)
                    return
                  }
                  setSubmitting(true)
                  setSubmitError(null)
                  const result = await submitGuestEntry(guestListSlug, {
                    name: guestName,
                    message: guestMessage,
                  })
                  setSubmitting(false)
                  setShowForm(false)
                  if (result.ok) {
                    setSubmittedOk(true)
                    setSubmittedName(guestName)
                    if (!isEditorView) setAlreadySubmitted(true)
                    setGuestName('')
                    setGuestMessage('')
                    try {
                      window.localStorage.setItem(
                        'guestlist-updated',
                        JSON.stringify({ slug: guestListSlug, ts: Date.now() }),
                      )
                    } catch {
                      // ignore
                    }
                  } else {
                    const messages: Record<typeof result.reason, string> = {
                      'invalid-name': 'Por favor escribe tu nombre.',
                      network: 'No hay conexión con el servidor. Verifica tu internet y vuelve a intentar.',
                      server: 'El servidor rechazó la confirmación. Intenta de nuevo en unos minutos.',
                    }
                    setSubmitError(messages[result.reason])
                  }
                }}
                className="mx-auto mt-4 max-w-lg rounded-3xl border border-ink-200 bg-white/95 p-6 shadow-sm shadow-ink-200/10 text-left"
              >
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-ink-500">Confirmación</p>
                <div className="space-y-4">
                  <label className="label-flat">Nombre</label>
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    placeholder="Nombre completo"
                    className="input-flat w-full"
                  />
                  <label className="label-flat">Mensaje (opcional)</label>
                  <textarea
                    value={guestMessage}
                    onChange={(e) => setGuestMessage(e.target.value)}
                    placeholder="Escribe un mensaje breve..."
                    rows={5}
                    className="input-flat w-full min-h-[140px] resize-none"
                  />
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
                    {submitting ? 'Enviando…' : 'Enviar confirmación'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setSubmitError(null)
                    }}
                    disabled={submitting}
                    className="btn-flat w-full sm:w-auto"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="invitation-btn mt-6"
          >
            {buttonLabel}
          </a>
        ) : data.rsvpLink ? (
          <a
            href={data.rsvpLink}
            target="_blank"
            rel="noreferrer"
            className="invitation-btn mt-6"
          >
            {buttonLabel}
          </a>
        ) : null}
        {data.accessCode && (
          <TextEl block={block} field="accessCode" as="p" className="mt-4 text-xs opacity-70">
            Código de acceso: <span className="font-mono">{data.accessCode}</span>
          </TextEl>
        )}
      </div>
    </BlockWrapper>
  )
}
