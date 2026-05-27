import { useEffect, useMemo, useState } from 'react'
import { apiUrl } from '../../utils/apiBase'
import type {
  Invitation,
  InvitationBlock,
  MenuHeaderData,
  MenuItem,
  MenuSectionData,
} from '../../types/invitation.types'
import { LANGUAGE_LABELS } from '../../utils/translation'

interface SectionMetrics {
  id: string
  title: string
  itemCount: number
  pricedCount: number
  averagePrice: number | null
}

interface MenuMetrics {
  totalSections: number
  totalItems: number
  pricedItems: number
  itemsWithDescription: number
  itemsWithBadges: number
  averagePrice: number | null
  medianPrice: number | null
  minPrice: number | null
  maxPrice: number | null
  priceCurrency: string
  perSection: SectionMetrics[]
  topExpensive: { name: string; price: number; section: string }[]
  topCheapest: { name: string; price: number; section: string }[]
  badgeCounts: { badge: string; count: number }[]
  priceBuckets: { label: string; count: number }[]
  languages: string[]
  variants: { id: string; label: string; isActive: boolean; itemCount: number }[]
  totalBlocks: number
  visibleBlocks: number
  hiddenBlocks: number
  lastUpdated: string
  publishedSince: string | null
}

// Parse the free-form price string ("$133", "1,250 MXN", "8.5 USD") into a
// number we can aggregate over. Returns null when the string has no numeric
// portion. We deliberately accept commas as thousands separators (Mexican
// menus often write "1,250") and dots as decimals.
function parsePrice(raw?: string): number | null {
  if (!raw) return null
  const match = raw.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/)
  if (!match) return null
  let s = match[1]
  // If both `.` and `,` appear, the LAST one is the decimal sep.
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if (s.includes(',')) {
    // If "," looks like a decimal (one comma, ≤2 trailing digits) keep it
    // as decimal — otherwise treat as thousands separator.
    const parts = s.split(',')
    if (parts.length === 2 && parts[1].length <= 2) s = `${parts[0]}.${parts[1]}`
    else s = s.replace(/,/g, '')
  }
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

function detectCurrency(samples: string[]): string {
  for (const s of samples) {
    if (!s) continue
    if (/USD/i.test(s)) return 'USD'
    if (/EUR|€/i.test(s)) return 'EUR'
    if (/MXN/i.test(s)) return 'MXN'
    if (s.includes('$')) return 'MXN' // default — most users here are in MX
  }
  return 'MXN'
}

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2
  return sorted[mid]
}

function computeMetrics(inv: Invitation): MenuMetrics {
  // Pick the blocks for the active variant (so metrics reflect what
  // visitors are actually seeing). Fall back to inv.blocks.
  let blocks: InvitationBlock[] = inv.blocks
  if (inv.menuVariants && inv.menuVariants.length > 0) {
    const active = inv.menuVariants.find((v) => v.id === inv.activeVariantId) ?? inv.menuVariants[0]
    blocks = active?.blocks ?? inv.blocks
  }

  const sectionBlocks = blocks.filter((b) => b.type === 'menu-section' && b.visible)

  const allItems: { item: MenuItem; section: string; price: number | null }[] = []
  const priceSamples: string[] = []

  for (const sb of sectionBlocks) {
    const d = sb.data as MenuSectionData
    for (const item of d.items ?? []) {
      const p = parsePrice(item.price)
      if (item.price) priceSamples.push(item.price)
      allItems.push({ item, section: d.title || 'Sección', price: p })
    }
  }

  const priceCurrency = detectCurrency(priceSamples)
  const numericPrices = allItems.map((x) => x.price).filter((p): p is number => p !== null)
  const sortedPrices = [...numericPrices].sort((a, b) => a - b)

  const averagePrice =
    numericPrices.length > 0 ? numericPrices.reduce((s, n) => s + n, 0) / numericPrices.length : null
  const medianPrice = median(sortedPrices)
  const minPrice = numericPrices.length > 0 ? sortedPrices[0] : null
  const maxPrice = numericPrices.length > 0 ? sortedPrices[sortedPrices.length - 1] : null

  // Per-section breakdown.
  const perSection: SectionMetrics[] = sectionBlocks.map((sb) => {
    const d = sb.data as MenuSectionData
    const items = d.items ?? []
    const priced = items.map((it) => parsePrice(it.price)).filter((p): p is number => p !== null)
    const avg = priced.length > 0 ? priced.reduce((s, n) => s + n, 0) / priced.length : null
    return {
      id: sb.id,
      title: d.title || 'Sección',
      itemCount: items.length,
      pricedCount: priced.length,
      averagePrice: avg,
    }
  })

  // Top expensive / cheapest (5 each).
  const ranked = allItems
    .filter((x) => x.price !== null)
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
  const topExpensive = ranked.slice(0, 5).map((x) => ({
    name: x.item.name,
    price: x.price as number,
    section: x.section,
  }))
  const topCheapest = ranked
    .slice()
    .reverse()
    .slice(0, 5)
    .map((x) => ({ name: x.item.name, price: x.price as number, section: x.section }))

  // Badge frequency. Badges live in a free-form string — split by comma /
  // pipe / bullet so users who type "vegan, gluten-free" or "vegan · spicy"
  // both work.
  const badgeFreq = new Map<string, number>()
  for (const { item } of allItems) {
    if (!item.badges) continue
    const parts = item.badges
      .split(/[,|·•]+/)
      .map((p) => p.trim())
      .filter(Boolean)
    for (const p of parts) {
      badgeFreq.set(p, (badgeFreq.get(p) ?? 0) + 1)
    }
  }
  const badgeCounts = Array.from(badgeFreq.entries())
    .map(([badge, count]) => ({ badge, count }))
    .sort((a, b) => b.count - a.count)

  // Price buckets — 5 equal-width ranges between min and max so the
  // histogram adapts to whatever range the menu actually covers.
  const priceBuckets: { label: string; count: number }[] = []
  if (numericPrices.length > 1 && minPrice !== null && maxPrice !== null && maxPrice > minPrice) {
    const bucketCount = Math.min(5, numericPrices.length)
    const step = (maxPrice - minPrice) / bucketCount
    for (let i = 0; i < bucketCount; i++) {
      const lo = minPrice + i * step
      const hi = i === bucketCount - 1 ? maxPrice : lo + step
      const count = numericPrices.filter((p) => p >= lo && (i === bucketCount - 1 ? p <= hi : p < hi)).length
      priceBuckets.push({
        label: `${formatCurrency(Math.round(lo), priceCurrency)} – ${formatCurrency(Math.round(hi), priceCurrency)}`,
        count,
      })
    }
  }

  const variants = (inv.menuVariants ?? []).map((v) => ({
    id: v.id,
    label: v.label,
    isActive: v.id === inv.activeVariantId,
    itemCount: v.blocks
      .filter((b) => b.type === 'menu-section')
      .reduce((sum, b) => sum + ((b.data as MenuSectionData).items?.length ?? 0), 0),
  }))

  const totalBlocks = blocks.length
  const visibleBlocks = blocks.filter((b) => b.visible).length

  return {
    totalSections: sectionBlocks.length,
    totalItems: allItems.length,
    pricedItems: numericPrices.length,
    itemsWithDescription: allItems.filter((x) => !!x.item.description?.trim()).length,
    itemsWithBadges: allItems.filter((x) => !!x.item.badges?.trim()).length,
    averagePrice,
    medianPrice,
    minPrice,
    maxPrice,
    priceCurrency,
    perSection,
    topExpensive,
    topCheapest,
    badgeCounts,
    priceBuckets,
    languages: inv.enabledLanguages ?? ['es'],
    variants,
    totalBlocks,
    visibleBlocks,
    hiddenBlocks: totalBlocks - visibleBlocks,
    lastUpdated: inv.updatedAt,
    publishedSince: inv.status === 'published' ? inv.updatedAt : null,
  }
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-ink-500">{hint}</p>}
    </div>
  )
}

function Bar({ value, total, color = '#9caf88' }: { value: number; total: number; color?: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
      <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function MetricsView({ slug }: { slug: string }) {
  const [inv, setInv] = useState<Invitation | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setInv(undefined)
    setError(null)
    try {
      const res = await fetch(`${apiUrl(`/api/metrics/${slug}`)}?_=${Date.now()}`, { cache: 'no-store' })
      if (res.status === 404) {
        setInv(null)
        setError('No encontramos métricas para este enlace. Es posible que el dueño las haya desactivado.')
        return
      }
      if (!res.ok) {
        setInv(null)
        setError(`El servidor respondió ${res.status}.`)
        return
      }
      const data = (await res.json()) as Invitation
      setInv(data)
    } catch (e) {
      setInv(null)
      setError(e instanceof Error ? e.message : 'No se pudo cargar')
    }
  }

  useEffect(() => {
    load()
  }, [slug])

  const metrics = useMemo(() => (inv ? computeMetrics(inv) : null), [inv])

  if (inv === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 text-ink-500">
        <p className="text-sm">Cargando métricas…</p>
      </div>
    )
  }

  if (!inv || !metrics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 p-8 text-center">
        <div>
          <p className="font-serif text-4xl leading-none text-ink-900">Sin métricas</p>
          <p className="mt-4 max-w-md text-sm text-ink-500">
            {error ?? 'El enlace no es válido o las métricas están desactivadas.'}
          </p>
        </div>
      </div>
    )
  }

  const headerBlock = inv.blocks.find((b) => b.type === 'menu-header')
  const menuTitle =
    headerBlock?.data && (headerBlock.data as MenuHeaderData).title
      ? (headerBlock.data as MenuHeaderData).title
      : inv.title

  const currency = metrics.priceCurrency
  const pricedPct = metrics.totalItems > 0 ? (metrics.pricedItems / metrics.totalItems) * 100 : 0
  const descPct =
    metrics.totalItems > 0 ? (metrics.itemsWithDescription / metrics.totalItems) * 100 : 0
  const badgePct = metrics.totalItems > 0 ? (metrics.itemsWithBadges / metrics.totalItems) * 100 : 0

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
        <header className="flex flex-col gap-2 border-b border-ink-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400">Dashboard de métricas</p>
            <h1 className="mt-1 font-serif text-3xl text-ink-900 md:text-4xl">{menuTitle}</h1>
            <p className="mt-1 text-xs text-ink-500">
              Última actualización: {new Date(metrics.lastUpdated).toLocaleString('es-MX')}
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="self-start rounded border border-ink-200 bg-white px-3 py-1.5 text-[11px] uppercase tracking-widest text-ink-600 hover:border-ink-900 hover:text-ink-900"
          >
            Actualizar
          </button>
        </header>

        {/* Resumen */}
        <section className="mt-6">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-500">Resumen</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Secciones" value={String(metrics.totalSections)} />
            <StatCard label="Platillos" value={String(metrics.totalItems)} />
            <StatCard
              label="Con precio"
              value={`${metrics.pricedItems}`}
              hint={`${pricedPct.toFixed(0)}% del menú`}
            />
            <StatCard
              label="Idiomas"
              value={String(metrics.languages.length)}
              hint={metrics.languages.map((l) => LANGUAGE_LABELS[l] ?? l).join(' · ')}
            />
          </div>
        </section>

        {/* Precios */}
        {metrics.pricedItems > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-500">Precios</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Promedio"
                value={metrics.averagePrice !== null ? formatCurrency(metrics.averagePrice, currency) : '—'}
              />
              <StatCard
                label="Mediana"
                value={metrics.medianPrice !== null ? formatCurrency(metrics.medianPrice, currency) : '—'}
              />
              <StatCard
                label="Mínimo"
                value={metrics.minPrice !== null ? formatCurrency(metrics.minPrice, currency) : '—'}
              />
              <StatCard
                label="Máximo"
                value={metrics.maxPrice !== null ? formatCurrency(metrics.maxPrice, currency) : '—'}
              />
            </div>

            {metrics.priceBuckets.length > 0 && (
              <div className="mt-4 rounded-xl border border-ink-200 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                  Distribución por rango de precio
                </p>
                <div className="mt-3 space-y-2">
                  {metrics.priceBuckets.map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs text-ink-700">
                        <span>{b.label}</span>
                        <span className="tabular-nums text-ink-500">{b.count}</span>
                      </div>
                      <div className="mt-1">
                        <Bar
                          value={b.count}
                          total={Math.max(...metrics.priceBuckets.map((x) => x.count))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Secciones */}
        {metrics.perSection.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-500">Platillos por sección</h2>
            <div className="space-y-2">
              {metrics.perSection.map((s) => (
                <div key={s.id} className="rounded-xl border border-ink-200 bg-white p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium text-ink-900">{s.title}</span>
                    <span className="shrink-0 tabular-nums text-xs text-ink-500">
                      {s.itemCount} platillo{s.itemCount === 1 ? '' : 's'}
                      {s.averagePrice !== null && ` · prom ${formatCurrency(s.averagePrice, currency)}`}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Bar
                      value={s.itemCount}
                      total={Math.max(...metrics.perSection.map((x) => x.itemCount))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top platillos */}
        {(metrics.topExpensive.length > 0 || metrics.topCheapest.length > 0) && (
          <section className="mt-8 grid gap-4 md:grid-cols-2">
            {metrics.topExpensive.length > 0 && (
              <div className="rounded-xl border border-ink-200 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                  Más caros
                </p>
                <ul className="mt-3 space-y-2">
                  {metrics.topExpensive.map((it, i) => (
                    <li key={`${it.name}-${i}`} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-sm text-ink-700">
                        <span className="text-ink-400">{i + 1}.</span> {it.name}{' '}
                        <span className="text-[10px] text-ink-400">· {it.section}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-sm font-medium text-ink-900">
                        {formatCurrency(it.price, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {metrics.topCheapest.length > 0 && (
              <div className="rounded-xl border border-ink-200 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                  Más económicos
                </p>
                <ul className="mt-3 space-y-2">
                  {metrics.topCheapest.map((it, i) => (
                    <li key={`${it.name}-${i}`} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-sm text-ink-700">
                        <span className="text-ink-400">{i + 1}.</span> {it.name}{' '}
                        <span className="text-[10px] text-ink-400">· {it.section}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-sm font-medium text-ink-900">
                        {formatCurrency(it.price, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Calidad del contenido */}
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-500">Calidad del contenido</h2>
          <div className="rounded-xl border border-ink-200 bg-white p-4 space-y-3">
            <Row label="Con precio" count={metrics.pricedItems} total={metrics.totalItems} pct={pricedPct} />
            <Row
              label="Con descripción"
              count={metrics.itemsWithDescription}
              total={metrics.totalItems}
              pct={descPct}
            />
            <Row
              label="Con etiquetas"
              count={metrics.itemsWithBadges}
              total={metrics.totalItems}
              pct={badgePct}
            />
          </div>
        </section>

        {/* Badges */}
        {metrics.badgeCounts.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-500">Etiquetas más comunes</h2>
            <div className="flex flex-wrap gap-2">
              {metrics.badgeCounts.map((b) => (
                <span
                  key={b.badge}
                  className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs text-ink-700"
                >
                  {b.badge}
                  <span className="ml-1.5 text-ink-400">{b.count}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Variantes (temporadas) */}
        {metrics.variants.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-500">Temporadas</h2>
            <div className="space-y-2">
              {metrics.variants.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-900">{v.label}</p>
                    <p className="text-[11px] text-ink-500">
                      {v.itemCount} platillo{v.itemCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  {v.isActive && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">
                      Activa
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Estructura técnica */}
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-500">Estructura</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Bloques" value={String(metrics.totalBlocks)} />
            <StatCard label="Visibles" value={String(metrics.visibleBlocks)} />
            <StatCard label="Ocultos" value={String(metrics.hiddenBlocks)} />
            <StatCard
              label="Estado"
              value={metrics.publishedSince ? 'Publicado' : 'Borrador'}
            />
          </div>
        </section>

        <footer className="mt-12 border-t border-ink-200 pt-4 text-center text-[10px] uppercase tracking-[0.2em] text-ink-400">
          Dashboard privado · Solo quienes tengan este enlace pueden verlo
        </footer>
      </div>
    </div>
  )
}

function Row({
  label,
  count,
  total,
  pct,
}: {
  label: string
  count: number
  total: number
  pct: number
}) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-ink-700">{label}</span>
        <span className="tabular-nums text-ink-500">
          {count} / {total} · {pct.toFixed(0)}%
        </span>
      </div>
      <div className="mt-1">
        <Bar value={count} total={total} />
      </div>
    </div>
  )
}
