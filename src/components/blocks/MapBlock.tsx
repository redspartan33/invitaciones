import { useEffect, useState } from 'react'
import type { InvitationBlock, MapData } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

interface LatLng {
  lat: number
  lng: number
}

const GEOCODE_CACHE_PREFIX = 'geocode:v1:'

function readCache(address: string): LatLng | null {
  try {
    const raw = window.localStorage.getItem(GEOCODE_CACHE_PREFIX + address)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') return parsed
    return null
  } catch {
    return null
  }
}

function writeCache(address: string, coords: LatLng) {
  try {
    window.localStorage.setItem(GEOCODE_CACHE_PREFIX + address, JSON.stringify(coords))
  } catch {
    // ignore quota
  }
}

function buildOsmEmbed({ lat, lng }: LatLng): string {
  // OpenStreetMap allows iframe embedding across origins (unlike Google Maps,
  // which sets X-Frame-Options: SAMEORIGIN and is refused by Firefox).
  const span = 0.005
  const bbox = `${lng - span},${lat - span * 0.6},${lng + span},${lat + span * 0.6}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

function buildGoogleLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export function MapBlock({ block }: { block: InvitationBlock<'map'> }) {
  const data = block.data as MapData
  const address = (data.address || '').trim()
  const explicitEmbed = data.embedUrl?.trim() || ''
  const height = data.height && data.height > 0 ? data.height : 320

  const [coords, setCoords] = useState<LatLng | null>(() => (address ? readCache(address) : null))
  const [geocodeError, setGeocodeError] = useState(false)

  useEffect(() => {
    if (!address) {
      setCoords(null)
      setGeocodeError(false)
      return
    }
    const cached = readCache(address)
    if (cached) {
      setCoords(cached)
      setGeocodeError(false)
      return
    }
    setGeocodeError(false)
    let cancelled = false
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { Accept: 'application/json' } },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (cancelled) return
        const first = Array.isArray(list) ? list[0] : null
        const lat = first ? parseFloat(first.lat) : NaN
        const lng = first ? parseFloat(first.lon) : NaN
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const c = { lat, lng }
          writeCache(address, c)
          setCoords(c)
        } else {
          setGeocodeError(true)
        }
      })
      .catch(() => {
        if (!cancelled) setGeocodeError(true)
      })
    return () => {
      cancelled = true
    }
  }, [address])

  const src = explicitEmbed || (coords ? buildOsmEmbed(coords) : '')

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
            {!address
              ? 'Añade una dirección para cargar el mapa.'
              : geocodeError
              ? 'No pudimos ubicar esa dirección. Verifica que sea correcta o ábrela en Google Maps.'
              : 'Buscando ubicación…'}
          </div>
        )}
        {address && (
          <a
            href={buildGoogleLink(address)}
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
