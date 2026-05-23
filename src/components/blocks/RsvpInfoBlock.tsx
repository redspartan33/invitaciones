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
        {whatsappUrl ? (
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
