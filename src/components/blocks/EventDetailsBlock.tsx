import type { EventDetailsData, InvitationBlock } from '../../types/invitation.types'
import { formatDate, formatTime } from '../../utils/blockValidation'
import { resolveFieldOrder } from '../../utils/fieldOrder'
import { BlockWrapper } from './BlockWrapper'
import { EventIcon } from './icons'
import { TextEl } from './TextEl'

export const EVENT_DETAILS_FIELD_ORDER = [
  'date',
  'time',
  'location',
  'address',
  'description',
] as const

export function EventDetailsBlock({ block }: { block: InvitationBlock<'event-details'> }) {
  const data = block.data as EventDetailsData
  const showDate = data.showDate !== false
  const showTime = data.showTime !== false
  const timeFormatted = showTime && data.time ? formatTime(data.time, data.timeFormat ?? '24h') : ''

  const order = resolveFieldOrder([...EVENT_DETAILS_FIELD_ORDER], block.style?.fieldOrder)

  const renderField = (field: string) => {
    switch (field) {
      case 'date':
        return showDate && data.date ? (
          <TextEl key="date" block={block} field="date" as="p" className="font-serif text-2xl">
            {formatDate(data.date, 'DD MMMM YYYY')}
          </TextEl>
        ) : null
      case 'time':
        return showTime && data.time ? (
          <TextEl key="time" block={block} field="time" as="p" className="text-sm uppercase tracking-widest opacity-70">
            {timeFormatted}
          </TextEl>
        ) : null
      case 'location':
        return data.location ? (
          <TextEl key="location" block={block} field="location" as="p" className="text-lg font-medium">
            {data.location}
          </TextEl>
        ) : null
      case 'address':
        return data.address ? (
          <TextEl key="address" block={block} field="address" as="p" className="text-sm opacity-70">
            {data.address}
          </TextEl>
        ) : null
      case 'description':
        return data.description ? (
          <TextEl key="description" block={block} field="description" as="p" className="mx-auto max-w-md text-sm opacity-80">
            {data.description}
          </TextEl>
        ) : null
      default:
        return null
    }
  }

  return (
    <BlockWrapper style={block.style}>
      <div className="flex flex-col items-center text-center" style={{ gap: 'var(--item-gap)' }}>
        {data.icon && !block.style?.hideIcons && <EventIcon kind={data.icon} className="h-10 w-10 accent" />}
        {order.map((f) => renderField(f))}
      </div>
    </BlockWrapper>
  )
}
