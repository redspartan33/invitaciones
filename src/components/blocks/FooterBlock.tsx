import type { FooterData, InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'

export function FooterBlock({ block }: { block: InvitationBlock<'footer'> }) {
  const data = block.data as FooterData
  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        {data.message && <p className="font-serif text-xl text-ink-700">{data.message}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-600">
          {data.phone && <span>☏ {data.phone}</span>}
          {data.email && <span>✉ {data.email}</span>}
          {data.instagram && <span>@ {data.instagram}</span>}
          {data.whatsapp && <span>WA {data.whatsapp}</span>}
        </div>
      </div>
    </BlockWrapper>
  )
}
