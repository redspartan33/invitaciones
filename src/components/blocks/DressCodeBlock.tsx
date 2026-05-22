import type { DressCodeData, InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export function DressCodeBlock({ block }: { block: InvitationBlock<'dress-code'> }) {
  const data = block.data as DressCodeData
  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        {data.code && (
          <TextEl block={block} field="label" as="p" className="accent mb-2 text-xs uppercase tracking-[0.3em]">
            Código de vestimenta
          </TextEl>
        )}
        {data.code && (
          <TextEl block={block} field="code" as="h2" className="font-serif text-4xl">
            {data.code}
          </TextEl>
        )}
        {data.notes && (
          <TextEl block={block} field="notes" as="p" className="mx-auto mt-4 max-w-md text-sm opacity-80">
            {data.notes}
          </TextEl>
        )}
        {data.inspirationImage && (
          <div className="mx-auto mt-8 w-full max-w-sm overflow-hidden border accent-border">
            <img src={data.inspirationImage} alt="Inspiración dress code" className="block h-64 w-full object-cover" />
          </div>
        )}
        {data.referenceLink && (
          <a
            href={data.referenceLink}
            target="_blank"
            rel="noreferrer"
            className="invitation-link mt-4 inline-block text-xs uppercase tracking-widest underline underline-offset-4"
          >
            <TextEl block={block} field="referenceLink">Ver referencia</TextEl>
          </a>
        )}
      </div>
    </BlockWrapper>
  )
}
