import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useSelectedBlock } from '../../hooks/useSelectedBlock'
import { DynamicBlockForm } from '../forms/DynamicBlockForm'
import { BLOCK_CATALOG } from '../../utils/blockDefaults'
import type { FontFamily, Language } from '../../types/invitation.types'
import { LANGUAGE_LABELS } from '../../utils/translation'

export function ConfigPanel() {
  const activePanel = useEditorStore((s) => s.activePanel)
  const selectedId = useEditorStore((s) => s.selectedBlockId)
  const selectBlock = useEditorStore((s) => s.selectBlock)
  const setActivePanel = useEditorStore((s) => s.setActivePanel)
  const selected = useSelectedBlock()
  const settings = useEditorStore((s) => s.invitation.globalSettings)
  const updateGlobalSettings = useEditorStore((s) => s.updateGlobalSettings)

  // On mobile the panel is hidden until something is selected/active.
  // 'block' is the default active panel — it only counts as "open" when a
  // block is actually selected.
  const isMobileOpen =
    activePanel === 'colors' ||
    activePanel === 'fonts' ||
    activePanel === 'music' ||
    activePanel === 'details' ||
    (activePanel === 'block' && !!selectedId)

  const close = () => {
    selectBlock(null)
    setActivePanel(null)
  }

  return (
    <aside
      className={`flex flex-col bg-white ${
        isMobileOpen ? 'fixed inset-0 z-40' : 'hidden'
      } md:static md:flex md:h-full md:w-[380px] md:shrink-0 md:border-l md:border-ink-200`}
    >
      <PanelHeader onClose={close} />
      <div className="flex-1 overflow-y-auto p-5 scroll-thin">
        {activePanel === 'colors' ? (
          <ColorsPanel
            settings={settings}
            update={updateGlobalSettings}
          />
        ) : activePanel === 'fonts' ? (
          <FontsPanel
            font={settings.fontFamily}
            headingFont={settings.headingFont ?? ''}
            bodyFont={settings.bodyFont ?? ''}
            update={(f) => updateGlobalSettings({ fontFamily: f })}
            updateFont={(patch) => updateGlobalSettings(patch)}
          />
        ) : activePanel === 'music' ? (
          <MusicPanel
            value={settings.backgroundMusic ?? ''}
            autoplay={settings.backgroundMusicAutoplay ?? false}
            update={(v) => updateGlobalSettings({ backgroundMusic: v })}
            updateAutoplay={(v) => updateGlobalSettings({ backgroundMusicAutoplay: v })}
          />
        ) : activePanel === 'details' ? (
          <DetailsPanel />
        ) : selected ? (
          <>
            <SelectedHeader />
            <DynamicBlockForm block={selected} />
          </>
        ) : (
          <EmptyPanel />
        )}
      </div>
      <div className="border-t border-ink-200 p-3 md:hidden">
        <button onClick={close} className="btn-primary w-full">
          Listo
        </button>
      </div>
    </aside>
  )
}

function PanelHeader({ onClose }: { onClose: () => void }) {
  const activePanel = useEditorStore((s) => s.activePanel)
  const selected = useSelectedBlock()
  let title = 'Configuración'
  if (activePanel === 'colors') title = 'Colores'
  else if (activePanel === 'fonts') title = 'Fuentes'
  else if (activePanel === 'music') title = 'Música'
  else if (activePanel === 'details') title = 'Detalles'
  else if (selected) {
    const info = BLOCK_CATALOG.find((b) => b.type === selected.type)
    title = info?.label ?? 'Bloque'
  }
  return (
    <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3">
      <h3 className="text-sm font-medium text-ink-900">{title}</h3>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar panel"
        className="-mr-2 inline-flex h-8 w-8 items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-900 md:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

function SelectedHeader() {
  const selected = useSelectedBlock()
  const deleteBlock = useEditorStore((s) => s.deleteBlock)
  const toggleVisibility = useEditorStore((s) => s.toggleBlockVisibility)
  if (!selected) return null
  const info = BLOCK_CATALOG.find((b) => b.type === selected.type)
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Bloque</p>
        <p className="text-sm font-medium">{info?.description}</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => toggleVisibility(selected.id)} className="btn-ghost text-xs">
          {selected.visible ? 'Ocultar' : 'Mostrar'}
        </button>
        <button
          onClick={() => {
            if (confirm('¿Eliminar este bloque?')) deleteBlock(selected.id)
          }}
          className="btn-ghost text-xs text-rose-600"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

function EmptyPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-ink-500">
      <p className="text-sm">Selecciona un bloque del canvas</p>
      <p className="mt-1 text-xs text-ink-400">o usa la barra inferior para añadir uno nuevo</p>
    </div>
  )
}

const SAVED_COLORS_KEY = 'invitation-builder:saved-colors'

const SUGGESTED_COLORS: { name: string; hex: string }[] = [
  { name: 'Sage', hex: '#9caf88' },
  { name: 'Terracotta', hex: '#c87f5a' },
  { name: 'Dusty Rose', hex: '#dcae96' },
  { name: 'Burgundy', hex: '#6e1f2c' },
  { name: 'Gold', hex: '#c9a96e' },
  { name: 'Champagne', hex: '#f1e3c8' },
  { name: 'Olive', hex: '#6b7a3a' },
  { name: 'Navy', hex: '#1f3a5f' },
  { name: 'Slate', hex: '#475569' },
  { name: 'Lavender', hex: '#b8a5cc' },
  { name: 'Cream', hex: '#f5efe6' },
  { name: 'Charcoal', hex: '#2a2a2a' },
]

function loadSavedColors(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(SAVED_COLORS_KEY)
    if (raw) {
      const arr = JSON.parse(raw) as unknown
      if (Array.isArray(arr)) return arr.filter((x): x is string => typeof x === 'string')
    }
  } catch { /* ignore */ }
  return []
}

function persistSavedColors(colors: string[]) {
  try { window.localStorage.setItem(SAVED_COLORS_KEY, JSON.stringify(colors)) } catch { /* ignore */ }
}

type ColorKey = 'colorPrimary' | 'colorSecondary' | 'colorAccent'

function ColorsPanel({
  settings,
  update,
}: {
  settings: { colorPrimary: string; colorSecondary: string; colorAccent: string }
  update: (p: Partial<{ colorPrimary: string; colorSecondary: string; colorAccent: string }>) => void
}) {
  const [activeKey, setActiveKey] = useState<ColorKey>('colorAccent')
  const [savedColors, setSavedColors] = useState<string[]>(() => loadSavedColors())

  const activeValue = settings[activeKey]
  const setActiveValue = (hex: string) => update({ [activeKey]: hex })

  const addSavedColor = () => {
    const hex = activeValue.toLowerCase()
    if (savedColors.includes(hex)) return
    const next = [hex, ...savedColors].slice(0, 24)
    setSavedColors(next)
    persistSavedColors(next)
  }

  const removeSavedColor = (hex: string) => {
    const next = savedColors.filter((c) => c !== hex)
    setSavedColors(next)
    persistSavedColors(next)
  }

  const targets: { key: ColorKey; label: string }[] = [
    { key: 'colorPrimary', label: 'Primario' },
    { key: 'colorSecondary', label: 'Secundario' },
    { key: 'colorAccent', label: 'Acento' },
  ]

  return (
    <div className="space-y-5">
      <p className="text-xs text-ink-500">Elige qué color editar y aplica desde la paleta o tus guardados.</p>

      <div>
        <label className="label-flat">Color activo a editar</label>
        <div className="grid grid-cols-3 gap-2">
          {targets.map((t) => {
            const isActive = activeKey === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveKey(t.key)}
                className={`flex flex-col items-center gap-1.5 rounded border px-2 py-2 text-xs transition-colors ${
                  isActive ? 'border-ink-900 bg-ink-50' : 'border-ink-200 bg-white hover:border-ink-400'
                }`}
              >
                <span
                  className="h-5 w-full rounded border border-ink-200"
                  style={{ background: settings[t.key] }}
                />
                <span className={`uppercase tracking-widest ${isActive ? 'text-ink-900 font-medium' : 'text-ink-500'}`}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="label-flat">Valor actual</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={activeValue}
            onChange={(e) => setActiveValue(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-ink-200 bg-white"
          />
          <input
            type="text"
            value={activeValue}
            onChange={(e) => setActiveValue(e.target.value)}
            className="input-flat"
          />
          <button
            type="button"
            onClick={addSavedColor}
            title="Guardar este color"
            className="btn-flat h-9 w-9 p-0 text-base"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <label className="label-flat">Colores sugeridos</label>
        <div className="grid grid-cols-6 gap-2">
          {SUGGESTED_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={`${c.name} · ${c.hex}`}
              onClick={() => setActiveValue(c.hex)}
              className="h-9 w-full rounded border border-ink-200 transition-transform hover:scale-105 hover:border-ink-900"
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="label-flat">Mis colores guardados</label>
        {savedColors.length === 0 ? (
          <p className="text-[11px] text-ink-400">
            Aún no tienes colores guardados. Usa el botón <span className="font-medium">+</span> para guardar el color activo.
          </p>
        ) : (
          <div className="grid grid-cols-6 gap-2">
            {savedColors.map((hex) => (
              <div key={hex} className="group relative">
                <button
                  type="button"
                  title={hex}
                  onClick={() => setActiveValue(hex)}
                  className="h-9 w-full rounded border border-ink-200 transition-transform hover:scale-105 hover:border-ink-900"
                  style={{ background: hex }}
                />
                <button
                  type="button"
                  onClick={() => removeSavedColor(hex)}
                  aria-label="Eliminar color"
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-ink-200 bg-white text-[10px] leading-none text-ink-600 opacity-0 transition-opacity group-hover:opacity-100 hover:border-rose-400 hover:text-rose-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const GOOGLE_FONT_PRESETS = [
  'Playfair Display',
  'Cormorant Garamond',
  'Libre Baskerville',
  'EB Garamond',
  'Lora',
  'Inter',
  'Poppins',
  'Montserrat',
  'Work Sans',
  'Nunito',
  'Great Vibes',
  'Dancing Script',
  'Allura',
  'Parisienne',
  'Cinzel',
] as const

function FontsPanel({
  font,
  headingFont,
  bodyFont,
  update,
  updateFont,
}: {
  font: FontFamily
  headingFont: string
  bodyFont: string
  update: (f: FontFamily) => void
  updateFont: (patch: { headingFont?: string; bodyFont?: string }) => void
}) {
  const fonts: { value: FontFamily; label: string; sample: string; cls: string }[] = [
    { value: 'serif', label: 'Serif', sample: 'Ana & Juan', cls: 'font-serif text-3xl' },
    { value: 'sans-serif', label: 'Sans', sample: 'Ana & Juan', cls: 'font-sans text-3xl' },
    { value: 'script', label: 'Script', sample: 'Ana & Juan', cls: 'font-script text-4xl' },
  ]
  const hasCustom = !!(headingFont || bodyFont)
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs text-ink-500">
          Familia tipográfica base. Si defines fuentes de Google Fonts más abajo, esas mandan.
        </p>
        {fonts.map((f) => (
          <button
            key={f.value}
            onClick={() => update(f.value)}
            className={`flex w-full items-center justify-between rounded border px-4 py-3 text-left transition-colors ${
              font === f.value && !hasCustom ? 'border-ink-900' : 'border-ink-200 hover:border-ink-400'
            }`}
          >
            <span className="text-xs uppercase tracking-widest text-ink-500">{f.label}</span>
            <span className={f.cls}>{f.sample}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3 border-t border-ink-200 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Google Fonts</h4>
          {hasCustom && (
            <button
              type="button"
              onClick={() => updateFont({ headingFont: '', bodyFont: '' })}
              className="text-[10px] uppercase tracking-widest text-ink-500 hover:text-rose-600"
            >
              Limpiar
            </button>
          )}
        </div>
        <p className="text-[11px] leading-snug text-ink-500">
          Escribe el nombre exacto de una fuente (ej.{' '}
          <span className="font-medium text-ink-700">Playfair Display</span>) o elige una sugerida.
        </p>

        <div>
          <label className="label-flat">Títulos (h1/h2/h3)</label>
          <input
            type="text"
            value={headingFont}
            onChange={(e) => updateFont({ headingFont: e.target.value })}
            placeholder="Playfair Display"
            className="input-flat"
            list="google-fonts-list"
          />
          {headingFont && (
            <p className="mt-1 text-sm" style={{ fontFamily: `"${headingFont}", serif` }}>
              Ana & Juan
            </p>
          )}
        </div>

        <div>
          <label className="label-flat">Cuerpo del texto</label>
          <input
            type="text"
            value={bodyFont}
            onChange={(e) => updateFont({ bodyFont: e.target.value })}
            placeholder="Inter"
            className="input-flat"
            list="google-fonts-list"
          />
          {bodyFont && (
            <p className="mt-1 text-sm" style={{ fontFamily: `"${bodyFont}", sans-serif` }}>
              Por favor confirma tu asistencia antes del 30 de mayo.
            </p>
          )}
        </div>

        <datalist id="google-fonts-list">
          {GOOGLE_FONT_PRESETS.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>

        <div className="flex flex-wrap gap-1.5">
          {GOOGLE_FONT_PRESETS.slice(0, 8).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => updateFont({ headingFont: preset })}
              className="rounded border border-ink-200 bg-white px-2 py-1 text-[11px] text-ink-600 transition-colors hover:border-ink-900"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function MusicPanel({
  value,
  autoplay,
  update,
  updateAutoplay,
}: {
  value: string
  autoplay: boolean
  update: (v: string) => void
  updateAutoplay: (v: boolean) => void
}) {
  const tracks = [
    { url: '', label: 'Sin música' },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', label: 'Clásica' },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', label: 'Acústica' },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', label: 'Jazz suave' },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', label: 'Romántica' },
  ]
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [previewing, setPreviewing] = useState<string | null>(null)

  const togglePreview = (url: string) => {
    if (!audioRef.current) audioRef.current = new Audio()
    const audio = audioRef.current
    if (previewing === url) {
      audio.pause()
      setPreviewing(null)
      return
    }
    audio.src = url
    audio.volume = 0.5
    audio.play().then(() => setPreviewing(url)).catch(() => setPreviewing(null))
    audio.onended = () => setPreviewing(null)
  }

  useEffect(() => () => {
    audioRef.current?.pause()
    audioRef.current = null
  }, [])

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">
        Música de fondo para la vista pública. Toca <span className="font-medium">▶</span> para escuchar un preview.
      </p>
      {tracks.map((t) => {
        const selected = value === t.url
        const isPlaying = previewing === t.url
        return (
          <div
            key={t.url || 'none'}
            className={`flex w-full items-center justify-between rounded border px-3 py-2 text-sm transition-colors ${
              selected ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white'
            }`}
          >
            <button onClick={() => update(t.url)} className="flex-1 text-left">
              {t.label} {selected && <span className="ml-1 text-xs">✓</span>}
            </button>
            {t.url && (
              <button
                onClick={() => togglePreview(t.url)}
                aria-label={isPlaying ? 'Pausar preview' : 'Reproducir preview'}
                className={`ml-2 flex h-7 w-7 items-center justify-center rounded-full border ${
                  selected ? 'border-white/40 hover:border-white' : 'border-ink-200 hover:border-ink-400'
                }`}
              >
                {isPlaying ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
            )}
          </div>
        )
      })}
      <div>
        <label className="label-flat">O pega una URL de audio (.mp3)</label>
        <input
          type="url"
          value={value && !tracks.some((t) => t.url === value) ? value : ''}
          onChange={(e) => update(e.target.value)}
          placeholder="https://…/cancion.mp3"
          className="input-flat"
        />
      </div>
      <label className="flex items-center justify-between gap-3 rounded border border-ink-200 bg-white px-3 py-2 text-sm">
        <span className="text-ink-700">Reproducir al abrir</span>
        <button
          type="button"
          onClick={() => updateAutoplay(!autoplay)}
          className={`relative h-5 w-9 rounded-full transition-colors ${autoplay ? 'bg-ink-900' : 'bg-ink-200'}`}
          aria-pressed={autoplay}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${autoplay ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </button>
      </label>
      <p className="text-[10px] text-ink-400">
        Los navegadores pueden bloquear el autoplay; si no inicia, comenzará al primer toque del invitado.
      </p>
    </div>
  )
}

function DetailsPanel() {
  const inv = useEditorStore((s) => s.invitation)
  const updateGlobalSettings = useEditorStore((s) => s.updateGlobalSettings)
  const setEnabledLanguages = useEditorStore((s) => s.setEnabledLanguages)
  const totalBlocks = inv.blocks.length
  const visible = inv.blocks.filter((b) => b.visible).length
  const favicon = inv.globalSettings.favicon ?? ''
  const isMenu = inv.kind === 'menu'
  return (
    <div className="space-y-3 text-sm">
      <FaviconRow value={favicon} onChange={(v) => updateGlobalSettings({ favicon: v })} />
      {isMenu && (
        <LanguagesRow
          enabled={inv.enabledLanguages ?? ['es']}
          onChange={setEnabledLanguages}
        />
      )}
      <div className="rounded border border-ink-200 p-3">
        <p className="text-[11px] uppercase tracking-widest text-ink-400">ID</p>
        <p className="font-mono text-xs text-ink-700">{inv.id}</p>
      </div>
      <div className="rounded border border-ink-200 p-3">
        <p className="text-[11px] uppercase tracking-widest text-ink-400">Estado</p>
        <p className="text-ink-700">{inv.status}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded border border-ink-200 p-3">
          <p className="text-[11px] uppercase tracking-widest text-ink-400">Bloques</p>
          <p className="text-xl">{totalBlocks}</p>
        </div>
        <div className="rounded border border-ink-200 p-3">
          <p className="text-[11px] uppercase tracking-widest text-ink-400">Visibles</p>
          <p className="text-xl">{visible}</p>
        </div>
      </div>
      <div className="rounded border border-ink-200 p-3">
        <p className="text-[11px] uppercase tracking-widest text-ink-400">Última edición</p>
        <p className="text-xs text-ink-700">{new Date(inv.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  )
}

function LanguagesRow({
  enabled,
  onChange,
}: {
  enabled: Language[]
  onChange: (langs: Language[]) => void
}) {
  // 'es' is the source language and always on. Only 'en' / 'fr' are toggles.
  const optional: Language[] = ['en', 'fr']
  const toggle = (lang: Language) => {
    const has = enabled.includes(lang)
    const next = has ? enabled.filter((l) => l !== lang) : [...enabled, lang]
    onChange(next)
  }
  const translationOn = optional.some((l) => enabled.includes(l))
  return (
    <div className="rounded border border-ink-200 p-3">
      <p className="text-[11px] uppercase tracking-widest text-ink-400">Traducción</p>
      <p className="mt-0.5 text-[11px] text-ink-500">
        Activa los idiomas que ofrecerás. Aparecerán como botones en el header del menú publicado.
        La traducción se genera automáticamente al publicar.
      </p>

      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between rounded border border-ink-200 bg-ink-50 px-3 py-2 text-xs text-ink-700">
          <span>
            <span className="font-medium">{LANGUAGE_LABELS.es}</span>{' '}
            <span className="text-ink-400">· original</span>
          </span>
          <span className="text-[10px] uppercase tracking-widest text-ink-400">Siempre activo</span>
        </div>
        {optional.map((lang) => {
          const on = enabled.includes(lang)
          return (
            <label
              key={lang}
              className="flex cursor-pointer items-center justify-between rounded border border-ink-200 bg-white px-3 py-2 text-xs text-ink-700 hover:border-ink-400"
            >
              <span className="font-medium">{LANGUAGE_LABELS[lang]}</span>
              <button
                type="button"
                onClick={() => toggle(lang)}
                className={`relative h-5 w-9 rounded-full transition-colors ${on ? 'bg-ink-900' : 'bg-ink-200'}`}
                aria-pressed={on}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    on ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          )
        })}
      </div>

      {translationOn && (
        <p className="mt-2 text-[10px] text-ink-400">
          Las traducciones se generan al publicar usando MyMemory (gratis). Si algún texto no se traduce
          bien, edítalo después en su bloque o vuelve a publicar.
        </p>
      )}
    </div>
  )
}

function FaviconRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const onFile = (file: File) => {
    if (file.size > 512 * 1024) {
      alert('El favicon debe pesar menos de 512 KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.readAsDataURL(file)
  }
  return (
    <div className="rounded border border-ink-200 p-3">
      <p className="text-[11px] uppercase tracking-widest text-ink-400">Favicon</p>
      <p className="mt-0.5 text-[11px] text-ink-500">Icono de la pestaña en el navegador. Recomendado: PNG/SVG cuadrado, 32×32 o más.</p>
      <div className="mt-2 flex items-center gap-2">
        {value ? (
          <img src={value} alt="Favicon" className="h-8 w-8 rounded border border-ink-200 bg-white object-contain" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded border border-dashed border-ink-300 text-[10px] text-ink-400">
            —
          </div>
        )}
        <input
          type="url"
          value={value.startsWith('data:') ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL o sube archivo →"
          className="input-flat flex-1"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-flat shrink-0"
        >
          Subir
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="btn-ghost shrink-0 text-rose-600"
            title="Quitar favicon"
          >
            ×
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/svg+xml,image/x-icon,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
