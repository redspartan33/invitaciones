import type { DressCodeData, InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'

export function DressCodeBlock({ block }: { block: InvitationBlock<'dress-code'> }) {
  const data = block.data as DressCodeData
  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        <p className="accent mb-2 text-xs uppercase tracking-[0.3em]">Código de vestimenta</p>
        <h2 className="font-serif text-4xl">{data.code}</h2>
        {data.notes && <p className="mx-auto mt-4 max-w-md text-sm opacity-80">{data.notes}</p>}
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
            Ver referencia
          </a>
        )}
      </div>
    </BlockWrapper>
  )
}
