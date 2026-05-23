import type { InvitationBlock, MapData } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

function buildEmbedUrl(address: string): string {
  // Google Maps' public embed endpoint accepts a freeform query — no API key
  // needed for the basic "search by address" mode.
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
}

function buildLinkUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export function MapBlock({ block }: { block: InvitationBlock<'map'> }) {
  const data = block.data as MapData
  const address = (data.address || '').trim()
  const src = data.embedUrl?.trim() || (address ? buildEmbedUrl(address) : '')
  const height = data.height && data.height > 0 ? data.height : 320

  return (
    <BlockWrapper style={block.style}>
      <div className="mx-auto max-w-2xl text-center">
        {data.title && (
          <TextEl block={block} field="title" as="h2" className="mb-4 font-serif text-3xl">
            {data.title}
          </TextEl>
        )}
        {address && !data.title && (
          <TextEl block={block} field="address" as="p" className="mb-4 text-sm uppercase tracking-[0.25em] opacity-80">
            {address}
          </TextEl>
        )}
        {src ? (
          <div className="overflow-hidden border accent-border" style={{ height }}>
            <iframe
              title={data.title || address || 'Mapa'}
              src={src}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-full w-full border-0"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="border border-dashed border-current/30 px-6 py-12 text-sm opacity-60">
            Añade una dirección para cargar el mapa.
          </div>
        )}
        {address && (
          <a
            href={buildLinkUrl(address)}
            target="_blank"
            rel="noreferrer"
            className="invitation-link mt-4 inline-block text-xs uppercase tracking-widest underline underline-offset-4"
          >
            {data.openLinkLabel || 'Abrir en Google Maps'} ↗
          </a>
        )}
      </div>
    </BlockWrapper>
  )
}
