import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { CtaButton, CtaData, InvitationBlock } from '../../types/invitation.types'
import { submitGuestEntry } from '../../utils/guestlistClient'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

/** Build a wa.me deep-link (digits only, URL-encoded text). */
function buildWhatsAppUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '')
  const base = `https://wa.me/${digits}`
  if (!message?.trim()) return base
  return `${base}?text=${encodeURIComponent(message)}`
}

export function CtaBlock({ block }: { block: InvitationBlock<'cta'> }) {
  const data = block.data as CtaData
  const [openForm, setOpenForm] = useState(false)

  const btnClass = (b: CtaButton) =>
    b.variant === 'secondary' ? 'invitation-btn' : 'invitation-btn accent-bg'

  const renderButton = (b: CtaButton) => {
    const label = b.label?.trim() || 'Acción'
    if (b.action === 'whatsapp') {
      const href = b.value?.trim() ? buildWhatsAppUrl(b.value, b.message) : ''
      return href ? (
        <a key={b.id} href={href} target="_blank" rel="noreferrer" className={btnClass(b)}>
          {label}
        </a>
      ) : (
        <span key={b.id} className={`${btnClass(b)} opacity-50`}>{label}</span>
      )
    }
    if (b.action === 'link') {
      return b.value?.trim() ? (
        <a key={b.id} href={b.value} target="_blank" rel="noreferrer" className={btnClass(b)}>
          {label}
        </a>
      ) : (
        <span key={b.id} className={`${btnClass(b)} opacity-50`}>{label}</span>
      )
    }
    // form
    return (
      <button key={b.id} type="button" onClick={() => setOpenForm(true)} className={btnClass(b)}>
        {label}
      </button>
    )
  }

  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        {data.title && (
          <TextEl block={block} field="title" as="h2" className="font-serif text-3xl">
            {data.title}
          </TextEl>
        )}
        {data.description && (
          <TextEl block={block} field="description" as="p" className="mx-auto mt-3 max-w-md text-sm opacity-80">
            {data.description}
          </TextEl>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {data.buttons.map(renderButton)}
        </div>
      </div>
      {openForm && <LeadForm block={block} onClose={() => setOpenForm(false)} />}
    </BlockWrapper>
  )
}

function LeadForm({ block, onClose }: { block: InvitationBlock<'cta'>; onClose: () => void }) {
  const data = block.data as CtaData
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-6" onClick={() => !submitting && onClose()}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          if (submitting) return
          if (!data.leadListSlug) {
            setError('Este formulario aún no está configurado. Avísale al anunciante.')
            return
          }
          setSubmitting(true)
          setError(null)
          // Reuse the guestlist endpoint: name + a combined message holding the
          // contact and the interested party's note.
          const composed = [contact && `Contacto: ${contact}`, message].filter(Boolean).join('\n')
          const result = await submitGuestEntry(data.leadListSlug, { name, message: composed })
          setSubmitting(false)
          if (result.ok) {
            setDone(true)
          } else {
            setError(result.reason === 'invalid-name' ? 'Por favor escribe tu nombre.' : 'No se pudo enviar. Intenta de nuevo.')
          }
        }}
        className="relative w-full max-w-lg rounded-3xl border border-ink-200 bg-white/95 p-6 text-left anim-fade-in"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-500">Me interesa</p>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Cerrar" className="text-ink-400 hover:text-ink-900 text-xl leading-none">
            ✕
          </button>
        </div>
        {done ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            <p className="font-medium">¡Gracias! Recibimos tus datos y te contactaremos pronto.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="label-flat">Nombre</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Tu nombre" className="input-flat w-full" />
              </div>
              <div>
                <label className="label-flat">Teléfono o email</label>
                <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="¿Cómo te contactamos?" className="input-flat w-full" />
              </div>
              <div>
                <label className="label-flat">{data.formMessageLabel?.trim() || 'Mensaje (opcional)'}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={data.formMessagePlaceholder?.trim() || 'Cuéntanos qué necesitas...'}
                  rows={4}
                  className="input-flat w-full min-h-[110px] resize-none"
                />
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
                {submitting ? 'Enviando…' : 'Enviar'}
              </button>
              <button type="button" onClick={onClose} disabled={submitting} className="btn-flat w-full sm:w-auto">
                Cancelar
              </button>
            </div>
          </>
        )}
      </form>
    </div>,
    document.body,
  )
}
