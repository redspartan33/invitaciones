import type { EventDetailsData, InvitationBlock } from '../../types/invitation.types'
import { formatDate } from '../../utils/blockValidation'
import { BlockWrapper } from './BlockWrapper'
import { EventIcon } from './icons'

export function EventDetailsBlock({ block }: { block: InvitationBlock<'event-details'> }) {
  const data = block.data as EventDetailsData
  return (
    <BlockWrapper style={block.style}>
      <div className="flex flex-col items-center gap-4 text-center">
        <EventIcon kind={data.icon} className="h-10 w-10 accent" />
        <div>
          <p className="font-serif text-2xl">{formatDate(data.date, 'DD MMMM YYYY')}</p>
          <p className="mt-1 text-sm uppercase tracking-widest opacity-70">{data.time}</p>
        </div>
        <div>
          <p className="text-lg font-medium">{data.location}</p>
          {data.address && <p className="text-sm opacity-70">{data.address}</p>}
        </div>
        {data.description && <p className="max-w-md text-sm opacity-80">{data.description}</p>}
      </div>
    </BlockWrapper>
  )
}
