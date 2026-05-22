import type { InvitationBlock, RsvpInfoData } from '../../types/invitation.types'
import { formatDate } from '../../utils/blockValidation'
import { BlockWrapper } from './BlockWrapper'

export function RsvpInfoBlock({ block }: { block: InvitationBlock<'rsvp-info'> }) {
  const data = block.data as RsvpInfoData
  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        <p className="accent mb-2 text-xs uppercase tracking-[0.3em]">RSVP</p>
        <h2 className="font-serif text-3xl">Confirma tu asistencia</h2>
        {data.instructions && <p className="mx-auto mt-3 max-w-md text-sm opacity-80">{data.instructions}</p>}
        {data.deadline && (
          <p className="mt-4 text-sm">
            Fecha límite: <span className="font-medium">{formatDate(data.deadline, 'DD MMMM YYYY')}</span>
          </p>
        )}
        <div className="mt-6 flex flex-col items-center gap-2 text-sm opacity-80">
          {data.contactEmail && <span>✉ {data.contactEmail}</span>}
          {data.contactPhone && <span>☏ {data.contactPhone}</span>}
        </div>
        {data.rsvpLink && (
          <a
            href={data.rsvpLink}
            target="_blank"
            rel="noreferrer"
            className="invitation-btn mt-6"
          >
            Confirmar asistencia
          </a>
        )}
        {data.accessCode && (
          <p className="mt-4 text-xs opacity-70">Código de acceso: <span className="font-mono">{data.accessCode}</span></p>
        )}
      </div>
    </BlockWrapper>
  )
}
