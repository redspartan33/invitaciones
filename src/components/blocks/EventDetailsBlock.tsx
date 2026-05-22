import type { EventDetailsData, InvitationBlock } from '../../types/invitation.types'
import { formatDate } from '../../utils/blockValidation'
import { BlockWrapper } from './BlockWrapper'
import { EventIcon } from './icons'
import { TextEl } from './TextEl'

export function EventDetailsBlock({ block }: { block: InvitationBlock<'event-details'> }) {
  const data = block.data as EventDetailsData
  return (
    <BlockWrapper style={block.style}>
      <div className="flex flex-col items-center gap-4 text-center">
        {data.icon && <EventIcon kind={data.icon} className="h-10 w-10 accent" />}
        {(data.date || data.time) && (
          <div>
            {data.date && (
              <TextEl block={block} field="date" as="p" className="font-serif text-2xl">
                {formatDate(data.date, 'DD MMMM YYYY')}
              </TextEl>
            )}
            {data.time && (
              <TextEl block={block} field="time" as="p" className="mt-1 text-sm uppercase tracking-widest opacity-70">
                {data.time}
              </TextEl>
            )}
          </div>
        )}
        {(data.location || data.address) && (
          <div>
            {data.location && (
              <TextEl block={block} field="location" as="p" className="text-lg font-medium">
                {data.location}
              </TextEl>
            )}
            {data.address && (
              <TextEl block={block} field="address" as="p" className="text-sm opacity-70">
                {data.address}
              </TextEl>
            )}
          </div>
        )}
        {data.description && (
          <TextEl block={block} field="description" as="p" className="max-w-md text-sm opacity-80">
            {data.description}
          </TextEl>
        )}
      </div>
    </BlockWrapper>
  )
}
