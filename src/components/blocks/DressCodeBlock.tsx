import type { DressCodeData, InvitationBlock } from '../../types/invitation.types'
import { resolveFieldOrder } from '../../utils/fieldOrder'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export const DRESS_CODE_FIELD_ORDER = [
  'label',
  'code',
  'notes',
  'inspirationImage',
  'referenceLink',
] as const

export function DressCodeBlock({ block }: { block: InvitationBlock<'dress-code'> }) {
  const data = block.data as DressCodeData
  const order = resolveFieldOrder([...DRESS_CODE_FIELD_ORDER], block.style?.fieldOrder)

  const renderField = (field: string) => {
    switch (field) {
      case 'label':
        return data.code ? (
          <TextEl key="label" block={block} field="label" as="p" className="accent text-xs uppercase tracking-[0.3em]">
            Código de vestimenta
          </TextEl>
        ) : null
      case 'code':
        return data.code ? (
          <TextEl key="code" block={block} field="code" as="h2" className="font-serif text-4xl">
            {data.code}
          </TextEl>
        ) : null
      case 'notes':
        return data.notes ? (
          <TextEl key="notes" block={block} field="notes" as="p" className="mx-auto max-w-md text-sm opacity-80">
            {data.notes}
          </TextEl>
        ) : null
      case 'inspirationImage':
        return data.inspirationImage ? (
          <div key="inspirationImage" className="mx-auto w-full max-w-sm overflow-hidden border accent-border">
            <img src={data.inspirationImage} alt="Inspiración dress code" className="block h-64 w-full object-cover" />
          </div>
        ) : null
      case 'referenceLink':
        return data.referenceLink ? (
          <a
            key="referenceLink"
            href={data.referenceLink}
            target="_blank"
            rel="noreferrer"
            className="invitation-link inline-block text-xs uppercase tracking-widest underline underline-offset-4"
          >
            <TextEl block={block} field="referenceLink">Ver referencia</TextEl>
          </a>
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
