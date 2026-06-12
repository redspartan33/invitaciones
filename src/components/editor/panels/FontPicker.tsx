import { useEffect, useMemo, useRef, useState } from 'react'
import type { FontCategory, FontRef } from '../../../types/invitation.types'
import { FONTSHARE_FONTS } from '../../../data/fontshareFonts'
import { loadPreviewFont } from '../../../hooks/useFontLoader'

interface CatalogEntry {
  family: string
  category: FontCategory
  provider: 'google' | 'fontshare'
}

type CategoryFilter = 'all' | FontCategory | 'fontshare'

const CATEGORY_CHIPS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'serif', label: 'Serif' },
  { id: 'sans-serif', label: 'Sans' },
  { id: 'display', label: 'Display' },
  { id: 'handwriting', label: 'Manuscrita' },
  { id: 'monospace', label: 'Mono' },
  { id: 'fontshare', label: 'Fontshare' },
]

const ROW_HEIGHT = 56
const LIST_HEIGHT = 384
const OVERSCAN = 4

// Module-level cache: the JSON chunk is imported once per session.
let catalogCache: CatalogEntry[] | null = null

async function loadCatalog(): Promise<CatalogEntry[]> {
  if (catalogCache) return catalogCache
  const mod = await import('../../../data/googleFonts.json')
  const google = (mod.default as { f: string; c: FontCategory }[]).map((e) => ({
    family: e.f,
    category: e.c,
    provider: 'google' as const,
  }))
  const fontshare = FONTSHARE_FONTS.map((e) => ({
    family: e.family,
    category: e.category,
    provider: 'fontshare' as const,
  }))
  // Fontshare first: it's a short curated list and otherwise drowns among
  // ~1900 Google families.
  catalogCache = [...fontshare, ...google]
  return catalogCache
}

function PreviewRow({
  entry,
  sample,
  size,
  isCurrent,
  onPick,
}: {
  entry: CatalogEntry
  sample: string
  size: number
  isCurrent: boolean
  onPick: () => void
}) {
  useEffect(() => {
    loadPreviewFont({ family: entry.family, provider: entry.provider }, sample)
  }, [entry.family, entry.provider, sample])

  return (
    <button
      type="button"
      onClick={onPick}
      style={{ height: ROW_HEIGHT }}
      className={`flex w-full items-center justify-between gap-3 border-b border-ink-100 px-3 text-left transition-colors hover:bg-ink-50 ${
        isCurrent ? 'bg-ink-50' : ''
      }`}
    >
      <span
        className="truncate"
        style={{ fontFamily: `"${entry.family}"`, fontSize: Math.min(size, 26) }}
        title={entry.family}
      >
        {sample || entry.family}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="max-w-[120px] truncate text-[10px] text-ink-500">{entry.family}</span>
        <span className="text-[9px] uppercase tracking-widest text-ink-400">
          {entry.provider === 'fontshare' ? 'Fontshare' : entry.category}
        </span>
      </span>
    </button>
  )
}

export function FontPicker({
  current,
  onPick,
  onClose,
}: {
  current?: FontRef | null
  onPick: (ref: FontRef) => void
  onClose: () => void
}) {
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(catalogCache)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [sample, setSample] = useState('Ana & Juan — 15 de junio')
  const [size, setSize] = useState(22)
  const [scrollTop, setScrollTop] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!catalog) loadCatalog().then(setCatalog)
  }, [catalog])

  const filtered = useMemo(() => {
    if (!catalog) return []
    const q = query.trim().toLowerCase()
    return catalog.filter((e) => {
      if (category === 'fontshare' && e.provider !== 'fontshare') return false
      if (category !== 'all' && category !== 'fontshare' && e.category !== category) return false
      if (q && !e.family.toLowerCase().includes(q)) return false
      return true
    })
  }, [catalog, query, category])

  // Manual virtualization: fixed-height rows, only render what's visible.
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const visibleCount = Math.ceil(LIST_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2
  const slice = filtered.slice(first, first + visibleCount)

  return (
    <div className="anim-fade-in space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">
          Elegir tipografía
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
        >
          ← Volver
        </button>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setScrollTop(0)
          listRef.current?.scrollTo({ top: 0 })
        }}
        placeholder="Buscar entre +1900 fuentes…"
        className="input-flat"
      />

      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setCategory(c.id)
              setScrollTop(0)
              listRef.current?.scrollTo({ top: 0 })
            }}
            className={`rounded border px-2 py-1 text-[11px] transition-colors ${
              category === c.id
                ? 'border-ink-900 bg-ink-900 text-on-accent'
                : 'border-ink-200 text-ink-600 hover:border-ink-400'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 rounded border border-ink-200 p-3">
        <label className="label-flat mb-0">Texto de muestra</label>
        <input
          type="text"
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          className="input-flat"
        />
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={16}
            max={72}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-ink-900"
          />
          <span className="w-10 shrink-0 text-right font-mono text-[11px] text-ink-500">{size}px</span>
        </div>
        {/* Live preview at full chosen size (rows cap at 26px for density). */}
        <div
          className="overflow-hidden border-t border-ink-100 pt-2"
          style={{ fontFamily: current ? `"${current.family}"` : undefined, fontSize: size, lineHeight: 1.2 }}
        >
          {sample || 'Ana & Juan'}
        </div>
      </div>

      {!catalog ? (
        <p className="py-8 text-center text-xs text-ink-400">Cargando catálogo…</p>
      ) : (
        <div
          ref={listRef}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          className="overflow-y-auto rounded border border-ink-200 scroll-thin"
          style={{ height: LIST_HEIGHT }}
        >
          <div style={{ height: filtered.length * ROW_HEIGHT, position: 'relative' }}>
            <div style={{ position: 'absolute', top: first * ROW_HEIGHT, left: 0, right: 0 }}>
              {slice.map((entry) => (
                <PreviewRow
                  key={`${entry.provider}:${entry.family}`}
                  entry={entry}
                  sample={sample}
                  size={size}
                  isCurrent={current?.family === entry.family && current?.provider === entry.provider}
                  onPick={() =>
                    onPick({ family: entry.family, provider: entry.provider, category: entry.category })
                  }
                />
              ))}
            </div>
          </div>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-xs text-ink-400">Sin resultados para «{query}»</p>
          )}
        </div>
      )}
      <p className="text-[10px] leading-snug text-ink-400">
        Catálogo completo de Google Fonts + selección de Fontshare. Todas son gratuitas para uso
        comercial (SIL OFL / Apache / ITF FFL).
      </p>
    </div>
  )
}
