import type { FooterData, InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export function FooterBlock({ block }: { block: InvitationBlock<'footer'> }) {
  const data = block.data as FooterData
  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        {data.message && (
          <TextEl block={block} field="message" as="p" className="font-serif text-xl">
            {data.message}
          </TextEl>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm opacity-80">
          {data.phone && <TextEl block={block} field="phone">☏ {data.phone}</TextEl>}
          {data.email && <TextEl block={block} field="email">✉ {data.email}</TextEl>}
          {data.instagram && <TextEl block={block} field="instagram" className="accent">@ {data.instagram}</TextEl>}
          {data.whatsapp && <TextEl block={block} field="whatsapp" className="accent">WA {data.whatsapp}</TextEl>}
        </div>
      </div>
    </BlockWrapper>
  )
}
