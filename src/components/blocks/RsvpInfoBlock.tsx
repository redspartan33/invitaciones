import { useState } from 'react'
import type { InvitationBlock, RsvpInfoData } from '../../types/invitation.types'
import { formatDate } from '../../utils/blockValidation'
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
  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        <TextEl block={block} field="label" as="p" className="accent mb-2 text-xs uppercase tracking-[0.3em]">
          RSVP
        </TextEl>
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
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="invitation-btn"
            >
              {buttonLabel}
            </button>
            {data.guestListLink && (
              <p className="mt-2 text-xs opacity-70">Link de invitados: <a href={data.guestListLink} target="_blank" rel="noreferrer" className="underline">Ver lista</a></p>
            )}
            {showForm && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!data.guestListSlug) return
                  setSubmitting(true)
                  try {
                    const res = await fetch(`/api/guestlists/${data.guestListSlug}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: guestName, message: guestMessage }),
                    })
                    if (res.ok) {
                      setSubmittedOk(true)
                      setGuestName('')
                      setGuestMessage('')
                    }
                  } catch {
                    // ignore
                  } finally {
                    setSubmitting(false)
                  }
                }}
                className="mx-auto mt-4 max-w-md space-y-3 text-sm"
              >
                {submittedOk ? (
                  <div className="rounded border border-ink-200 bg-emerald-50 p-3 text-emerald-800">Gracias — tu confirmación quedó registrada.</div>
                ) : (
                  <>
                    <label className="label-flat">Nombre</label>
                    <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required className="input-field w-full" />
                    <label className="label-flat">Mensaje (opcional)</label>
                    <textarea value={guestMessage} onChange={(e) => setGuestMessage(e.target.value)} className="input-field w-full" />
                    <div className="flex items-center gap-2">
                      <button type="submit" disabled={submitting} className="invitation-btn">{submitting ? 'Enviando…' : 'Enviar'}</button>
                      <button type="button" onClick={() => setShowForm(false)} className="text-sm text-ink-600">Cancelar</button>
                    </div>
                  </>
                )}
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
