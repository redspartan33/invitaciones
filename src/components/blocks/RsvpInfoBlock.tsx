import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { InvitationBlock, RsvpInfoData } from '../../types/invitation.types'
import { formatDate } from '../../utils/blockValidation'
import { resolveFieldOrder } from '../../utils/fieldOrder'
import { getSubmittedName, hasSubmitted, submitGuestEntry } from '../../utils/guestlistClient'
import { BlockWrapper } from './BlockWrapper'
import { usePersonalPass } from './PersonalPassContext'
import { confirmPass } from '../../utils/personalPass'
import { TextEl } from './TextEl'

export const RSVP_FIELD_ORDER = [
  'heading',
  'instructions',
  'deadline',
  'contactEmail',
  'contactPhone',
] as const

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
  const passState = usePersonalPass()

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
  useEffect(() => {
    if (!showForm) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        setShowForm(false)
        setSubmitError(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showForm, submitting])
  const isEditorView = typeof window !== 'undefined' && new URL(window.location.href).searchParams.has('admin')
  // Personal pass (`?pase=`): same card, same button, same modal — only the
  // form inside the modal changes (name and seats are fixed by the host).
  const pass = passState.status === 'ready' ? passState.pass : undefined
  const passLoading = passState.status === 'loading'
  const passMode = !!pass || passLoading
  const passGuestListSlug = passState.status === 'ready' ? passState.guestListSlug : undefined
  // In the editor we always show the controls so the designer can preview the
  // flow; only the public published view enforces the one-confirmation lock.
  const locked = passMode
    ? passState.status === 'ready' && passState.alreadyConfirmed && !isEditorView
    : alreadySubmitted && !isEditorView
  const lockedName = pass ? pass.name : submittedName
  const order = resolveFieldOrder([...RSVP_FIELD_ORDER], block.style?.fieldOrder)
  const renderField = (field: string) => {
    switch (field) {
      case 'heading':
        return (
          <TextEl key="heading" block={block} field="heading" as="h2" className="font-serif text-3xl">
            Confirma tu asistencia
          </TextEl>
        )
      case 'instructions':
        return data.instructions ? (
          <TextEl key="instructions" block={block} field="instructions" as="p" className="mx-auto max-w-md text-sm opacity-80">
            {data.instructions}
          </TextEl>
        ) : null
      case 'deadline':
        return data.deadline ? (
          <TextEl key="deadline" block={block} field="deadline" as="p" className="text-sm">
            Fecha límite: <span className="font-medium">{formatDate(data.deadline, 'DD MMMM YYYY')}</span>
          </TextEl>
        ) : null
      case 'contactEmail':
        return data.contactEmail ? (
          <TextEl key="contactEmail" block={block} field="contactEmail" as="p" className="text-sm opacity-80">
            ✉ {data.contactEmail}
          </TextEl>
        ) : null
      case 'contactPhone':
        return data.contactPhone ? (
          <TextEl key="contactPhone" block={block} field="contactPhone" as="p" className="text-sm opacity-80">
            ☏ {data.contactPhone}
          </TextEl>
        ) : null
      default:
        return null
    }
  }

  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        <div className="flex flex-col items-center" style={{ gap: 'var(--item-gap)' }}>
          {order.map((f) => renderField(f))}
        </div>
        {data.useRsvpForm || passMode ? (
          <div className="mt-6 space-y-4">
            {passState.status === 'invalid' && (
              <p className="mx-auto max-w-md text-xs opacity-70">
                Este pase personalizado ya no está disponible. Puedes confirmar con el formulario.
              </p>
            )}
            {locked && (
              <div className="mx-auto mt-4 max-w-lg rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="font-medium">
                  {lockedName ? `¡Gracias, ${lockedName}!` : '¡Gracias!'} Tu confirmación quedó registrada.
                </p>
                <p className="mt-1 text-xs opacity-80">
                  {passMode
                    ? 'Este pase ya fue confirmado.'
                    : 'Solo se permite una confirmación por dispositivo.'}
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
                disabled={passLoading}
                className="invitation-btn disabled:opacity-60"
              >
                {buttonLabel}
              </button>
            )}
            {!locked && submittedOk && !showForm && (
              <div className="mx-auto mt-4 max-w-lg rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="font-medium">
                  {pass ? `¡Gracias, ${pass.name}!` : '¡Gracias!'} Tu confirmación quedó registrada.
                </p>
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
            {!locked && showForm && createPortal(
              <div
                className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-6"
                onClick={() => {
                  if (submitting) return
                  setShowForm(false)
                  setSubmitError(null)
                }}
              >
                <form
                  onClick={(e) => e.stopPropagation()}
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (submitting) return
                    if (pass && passGuestListSlug) {
                      setSubmitting(true)
                      setSubmitError(null)
                      const res = await confirmPass(passGuestListSlug, pass, guestMessage)
                      setSubmitting(false)
                      setShowForm(false)
                      if (res.ok) {
                        setSubmittedOk(true)
                        setGuestMessage('')
                      } else {
                        setSubmitError(
                          res.reason === 'network'
                            ? 'No hay conexión con el servidor. Verifica tu internet y vuelve a intentar.'
                            : 'El servidor rechazó la confirmación.',
                        )
                      }
                      return
                    }
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
                      const baseMessages = {
                        'invalid-name': 'Por favor escribe tu nombre.',
                        network: 'No hay conexión con el servidor. Verifica tu internet y vuelve a intentar.',
                        server: 'El servidor rechazó la confirmación.',
                      } as const
                      const base = baseMessages[result.reason]
                      setSubmitError(
                        'detail' in result && result.detail
                          ? `${base} (${result.detail})`
                          : base,
                      )
                    }
                  }}
                  className="relative w-full max-w-lg rounded-3xl border border-ink-200 bg-white/95 p-6 shadow-xl shadow-ink-900/10 text-left anim-fade-in"
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-500">Confirmación</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        setSubmitError(null)
                      }}
                      disabled={submitting}
                      aria-label="Cerrar"
                      className="text-ink-400 hover:text-ink-900 text-xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    {pass ? (
                      <div className="rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3">
                        <p className="label-flat !mb-1">Pase personalizado</p>
                        <p className="text-lg font-medium text-ink-900">{pass.name}</p>
                        <p className="text-sm text-ink-600">
                          {pass.guests === 1 ? '1 lugar reservado' : `${pass.guests} lugares reservados`}
                        </p>
                        {pass.note && (
                          <p className="mt-2 whitespace-pre-line text-sm italic text-ink-700">“{pass.note}”</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <label className="label-flat">Nombre</label>
                        <input
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          required
                          placeholder="Nombre completo"
                          className="input-flat w-full"
                        />
                      </>
                    )}
                    <label className="label-flat">{pass ? 'Mensaje (opcional)' : data.messageLabel?.trim() || 'Mensaje (opcional)'}</label>
                    <textarea
                      value={guestMessage}
                      onChange={(e) => setGuestMessage(e.target.value)}
                      placeholder={
                        pass
                          ? 'Escribe unas palabras para los anfitriones…'
                          : data.messagePlaceholder?.trim() || 'Escribe un mensaje breve...'
                      }
                      rows={pass ? 3 : 5}
                      className="input-flat w-full min-h-[140px] resize-none"
                    />
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
                      {submitting ? 'Enviando…' : pass ? 'Confirmar' : 'Enviar confirmación'}
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
              </div>,
              document.body,
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
