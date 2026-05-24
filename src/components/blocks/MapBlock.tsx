import type { InvitationBlock, MapData } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

// We avoid client-side geocoding (Nominatim rate-limits aggressive browser
// usage and many networks block it). Google Maps' classic `?output=embed`
// URL accepts a free-text address as a query parameter and renders an
// embeddable iframe without any API key — it's the most reliable
// no-config option available in 2026 for arbitrary addresses.
function buildGoogleEmbed(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`
}

function buildGoogleLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export function MapBlock({ block }: { block: InvitationBlock<'map'> }) {
  const data = block.data as MapData
  const address = (data.address || '').trim()
  const explicitEmbed = data.embedUrl?.trim() || ''
  const height = data.height && data.height > 0 ? data.height : 320

  const src = explicitEmbed || (address ? buildGoogleEmbed(address) : '')
  const linkLabel = data.openLinkLabel || 'Abrir en Google Maps'

  return (
    <BlockWrapper style={block.style}>
      <div className="mx-auto w-full max-w-2xl text-center">
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
            href={buildGoogleLink(address)}
            target="_blank"
            rel="noreferrer"
            className="invitation-btn mt-5 inline-flex"
          >
            {linkLabel} ↗
          </a>
        )}
      </div>
    </BlockWrapper>
  )
}
