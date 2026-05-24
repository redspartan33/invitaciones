import type { FooterData, InvitationBlock } from '../../types/invitation.types'
import { resolveFieldOrder } from '../../utils/fieldOrder'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export const FOOTER_FIELD_ORDER = [
  'message',
  'phone',
  'email',
  'instagram',
  'whatsapp',
] as const

export function FooterBlock({ block }: { block: InvitationBlock<'footer'> }) {
  const data = block.data as FooterData
  const order = resolveFieldOrder([...FOOTER_FIELD_ORDER], block.style?.fieldOrder)

  const renderField = (field: string) => {
    switch (field) {
      case 'message':
        return data.message ? (
          <TextEl key="message" block={block} field="message" as="p" className="font-serif text-xl">
            {data.message}
          </TextEl>
        ) : null
      case 'phone':
        return data.phone ? (
          <TextEl key="phone" block={block} field="phone" as="p" className="text-sm opacity-80">
            ☏ {data.phone}
          </TextEl>
        ) : null
      case 'email':
        return data.email ? (
          <TextEl key="email" block={block} field="email" as="p" className="text-sm opacity-80">
            ✉ {data.email}
          </TextEl>
        ) : null
      case 'instagram':
        return data.instagram ? (
          <TextEl key="instagram" block={block} field="instagram" as="p" className="accent text-sm">
            @ {data.instagram}
          </TextEl>
        ) : null
      case 'whatsapp':
        return data.whatsapp ? (
          <TextEl key="whatsapp" block={block} field="whatsapp" as="p" className="accent text-sm">
            WA {data.whatsapp}
          </TextEl>
        ) : null
      default:
        return null
    }
  }

  return (
    <BlockWrapper style={block.style}>
      <div className="flex flex-col items-center text-center" style={{ gap: 'var(--item-gap)' }}>
        {order.map((f) => renderField(f))}
      </div>
    </BlockWrapper>
  )
}
