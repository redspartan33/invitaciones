import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useSelectedBlock } from '../../hooks/useSelectedBlock'
import { DynamicBlockForm } from '../forms/DynamicBlockForm'
import { BLOCK_CATALOG } from '../../utils/blockDefaults'
import type {
  EnvelopeIntroConfig,
  FontFamily,
  Invitation,
  Language,
  PageBackground,
} from '../../types/invitation.types'
import { LANGUAGE_LABELS } from '../../utils/translation'
import { detectBackgroundKind, resolveBackgroundSource } from '../../utils/pageBackground'

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
  const pageTitle = inv.globalSettings.pageTitle ?? ''
  const isMenu = inv.kind === 'menu'
  return (
    <div className="space-y-3 text-sm">
      <PageTitleRow
        value={pageTitle}
        placeholder={inv.title}
        onChange={(v) => updateGlobalSettings({ pageTitle: v })}
      />
      <FaviconRow value={favicon} onChange={(v) => updateGlobalSettings({ favicon: v })} />
      <PageBackgroundRow
        bg={inv.globalSettings.pageBackground}
        transparentCanvas={!!inv.globalSettings.transparentCanvas}
        onChange={(patch) =>
          updateGlobalSettings({
            pageBackground: patch === null ? undefined : { ...(inv.globalSettings.pageBackground ?? { url: '' }), ...patch },
          })
        }
        onToggleTransparent={(v) => updateGlobalSettings({ transparentCanvas: v })}
      />
      {!isMenu && (
        <EnvelopeIntroRow
          config={inv.globalSettings.envelopeIntro}
          invitationId={inv.id}
          invitation={inv}
          onChange={(patch) =>
            updateGlobalSettings({
              envelopeIntro:
                patch === null
                  ? undefined
                  : {
                      ...(inv.globalSettings.envelopeIntro ?? { enabled: false }),
                      ...patch,
                    },
            })
          }
        />
      )}
      {isMenu && <SeasonsRow />}
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

function PageTitleRow({
  value,
  placeholder,
  onChange,
}: {
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded border border-ink-200 p-3">
      <p className="text-[11px] uppercase tracking-widest text-ink-400">Nombre en la pestaña</p>
      <p className="mt-0.5 text-[11px] text-ink-500">
        Texto que se muestra en la pestaña del navegador. Si lo dejas vacío, se usa el título del documento.
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Mi invitación'}
        className="input-flat mt-2"
        maxLength={80}
      />
    </div>
  )
}

const BG_POSITIONS: { value: NonNullable<PageBackground['position']>; label: string }[] = [
  { value: 'top-left', label: '↖' },
  { value: 'top', label: '↑' },
  { value: 'top-right', label: '↗' },
  { value: 'left', label: '←' },
  { value: 'center', label: '●' },
  { value: 'right', label: '→' },
  { value: 'bottom-left', label: '↙' },
  { value: 'bottom', label: '↓' },
  { value: 'bottom-right', label: '↘' },
]

function PageBackgroundRow({
  bg,
  transparentCanvas,
  onChange,
  onToggleTransparent,
}: {
  bg?: PageBackground
  transparentCanvas: boolean
  onChange: (patch: Partial<PageBackground> | null) => void
  onToggleTransparent: (v: boolean) => void
}) {
  const url = bg?.url ?? ''
  const detectedKind = detectBackgroundKind(url)
  const source = resolveBackgroundSource(bg)
  const isVideo =
    source.kind === 'video-file' || source.kind === 'youtube' || source.kind === 'vimeo'
  const opacity = bg?.opacity ?? 100
  const blur = bg?.blur ?? 0
  const overlayOpacity = bg?.overlayOpacity ?? 0
  const overlayColor = bg?.overlayColor ?? '#000000'
  const attachment = bg?.attachment ?? 'fixed'
  const fit = bg?.fit ?? 'cover'
  const position = bg?.position ?? 'center'

  return (
    <div className="rounded border border-ink-200 p-3">
      <p className="text-[11px] uppercase tracking-widest text-ink-400">Fondo de página</p>
      <p className="mt-0.5 text-[11px] text-ink-500">
        Imagen o link de video (YouTube, Vimeo, MP4). Los videos se reproducen silenciados, en loop.
      </p>

      <input
        type="url"
        value={url}
        onChange={(e) => onChange({ url: e.target.value })}
        placeholder="https://…  o  https://youtu.be/…"
        className="input-flat mt-2"
      />

      {url && (
        <>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-500">
            <span className="rounded-full border border-ink-200 px-2 py-0.5">
              {isVideo ? 'Video (mute · loop)' : detectedKind === 'image' ? 'Imagen' : 'Auto'}
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="ml-auto text-ink-500 hover:text-rose-600"
            >
              Quitar
            </button>
          </div>

          {/* Fit */}
          <div className="mt-3">
            <label className="label-flat">Ajuste</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['cover', 'contain', 'tile', 'auto'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onChange({ fit: f })}
                  className={`rounded border px-2 py-1.5 text-[11px] capitalize transition-colors ${
                    fit === f
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Position (3x3) — only meaningful for images */}
          {!isVideo && (
            <div className="mt-3">
              <label className="label-flat">Posición</label>
              <div className="grid w-fit grid-cols-3 gap-1">
                {BG_POSITIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => onChange({ position: p.value })}
                    className={`h-7 w-7 rounded border text-xs ${
                      position === p.value
                        ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-ink-200 bg-white text-ink-500 hover:border-ink-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attachment */}
          <div className="mt-3">
            <label className="label-flat">Comportamiento al scroll</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['fixed', 'scroll'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => onChange({ attachment: a })}
                  className={`rounded border px-2 py-1.5 text-[11px] transition-colors ${
                    attachment === a
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
                  }`}
                >
                  {a === 'fixed' ? 'Fijo (parallax)' : 'Scrollea'}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity */}
          <div className="mt-3">
            <label className="label-flat flex items-center justify-between">
              <span>Opacidad</span>
              <span className="text-[10px] text-ink-400">{opacity}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => onChange({ opacity: Number(e.target.value) })}
              className="w-full accent-ink-900"
            />
          </div>

          {/* Blur */}
          <div className="mt-2">
            <label className="label-flat flex items-center justify-between">
              <span>Desenfoque</span>
              <span className="text-[10px] text-ink-400">{blur}px</span>
            </label>
            <input
              type="range"
              min={0}
              max={30}
              value={blur}
              onChange={(e) => onChange({ blur: Number(e.target.value) })}
              className="w-full accent-ink-900"
            />
          </div>

          {/* Overlay */}
          <div className="mt-3">
            <label className="label-flat flex items-center justify-between">
              <span>Color encima</span>
              <span className="text-[10px] text-ink-400">{overlayOpacity}%</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={overlayColor}
                onChange={(e) => onChange({ overlayColor: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-ink-200 bg-white"
              />
              <input
                type="range"
                min={0}
                max={100}
                value={overlayOpacity}
                onChange={(e) => onChange({ overlayOpacity: Number(e.target.value) })}
                className="flex-1 accent-ink-900"
              />
            </div>
          </div>

          {/* Canvas transparency */}
          <label className="mt-3 flex items-center justify-between gap-3 rounded border border-ink-200 bg-white px-3 py-2 text-xs">
            <span className="text-ink-700">Tarjeta central transparente</span>
            <button
              type="button"
              onClick={() => onToggleTransparent(!transparentCanvas)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                transparentCanvas ? 'bg-ink-900' : 'bg-ink-200'
              }`}
              aria-pressed={transparentCanvas}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  transparentCanvas ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
          <p className="mt-1 text-[10px] text-ink-400">
            Si está encendido, el fondo se ve a través del lienzo central; si está apagado, queda detrás del color secundario.
          </p>
        </>
      )}
    </div>
  )
}

function EnvelopeIntroRow({
  config,
  invitationId,
  invitation,
  onChange,
}: {
  config?: EnvelopeIntroConfig
  invitationId: string
  invitation: Invitation
  onChange: (patch: Partial<EnvelopeIntroConfig> | null) => void
}) {
  const enabled = !!config?.enabled
  const envelopeColor = config?.envelopeColor ?? '#a3b88c'
  const liningColor = config?.liningColor ?? '#f4ead7'
  const backgroundColor = config?.backgroundColor ?? '#eef2e5'
  const recipientName = config?.recipientName ?? ''
  const monogram = config?.monogram ?? ''
  const cardPreviewImage = config?.cardPreviewImage ?? ''
  const showWax = !!config?.wax
  const waxColor = config?.waxColor ?? '#9c3a3a'
  const hintLabel = config?.hintLabel ?? ''
  const autoOpen = !!config?.autoOpen
  const alwaysShowOnReload = !!config?.alwaysShowOnReload

  // Force the EnvelopeIntro overlay to re-mount each time the user presses
  // "Vista previa", since the component caches its own stage state.
  const [previewNonce, setPreviewNonce] = useState(0)
  const triggerPreview = () => {
    try {
      sessionStorage.removeItem(`envelope-intro:${invitationId}`)
    } catch {
      /* ignore */
    }
    setPreviewNonce((n) => n + 1)
  }

  return (
    <div className="rounded border border-ink-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-ink-400">Intro de sobre</p>
          <p className="mt-0.5 text-[11px] text-ink-500">
            Antes de mostrar la invitación, aparece un sobre cerrado. Al tocarlo la solapa
            se abre y la invitación sale del sobre.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(enabled ? { enabled: false } : { enabled: true })}
          className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${enabled ? 'bg-ink-900' : 'bg-ink-200'}`}
          aria-pressed={enabled}
          aria-label="Activar intro de sobre"
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-3 space-y-3">
          {/* Colors */}
          <div className="grid grid-cols-3 gap-2">
            <ColorField
              label="Sobre"
              value={envelopeColor}
              onChange={(v) => onChange({ envelopeColor: v })}
            />
            <ColorField
              label="Forro"
              value={liningColor}
              onChange={(v) => onChange({ liningColor: v })}
            />
            <ColorField
              label="Fondo"
              value={backgroundColor}
              onChange={(v) => onChange({ backgroundColor: v })}
            />
          </div>

          {/* Recipient + monogram */}
          <div>
            <label className="label-flat">Nombre del invitado</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => onChange({ recipientName: e.target.value })}
              placeholder="Arlenne González"
              className="input-flat"
              maxLength={60}
            />
          </div>
          <div>
            <label className="label-flat">Monograma / iniciales</label>
            <input
              type="text"
              value={monogram}
              onChange={(e) => onChange({ monogram: e.target.value })}
              placeholder="A · G"
              className="input-flat"
              maxLength={12}
            />
          </div>

          {/* Optional preview image (shown on the card peeking out of envelope) */}
          <div>
            <label className="label-flat">Imagen del frente (opcional)</label>
            <input
              type="url"
              value={cardPreviewImage}
              onChange={(e) => onChange({ cardPreviewImage: e.target.value })}
              placeholder="https://…"
              className="input-flat"
            />
            <p className="mt-1 text-[10px] text-ink-400">
              Imagen que se ve impresa en la tarjeta cuando sale del sobre. Si la dejas vacía
              usa el nombre y el monograma.
            </p>
          </div>

          {/* Wax seal toggle */}
          <label className="flex cursor-pointer items-center justify-between rounded border border-ink-200 bg-white px-3 py-2 text-xs text-ink-700 hover:border-ink-400">
            <span className="font-medium">Sello de cera</span>
            <span className="flex items-center gap-2">
              {showWax && (
                <input
                  type="color"
                  value={waxColor}
                  onChange={(e) => onChange({ waxColor: e.target.value })}
                  className="h-5 w-7 cursor-pointer rounded border border-ink-200 bg-white"
                  aria-label="Color del sello"
                />
              )}
              <button
                type="button"
                onClick={() => onChange({ wax: !showWax })}
                className={`relative h-5 w-9 rounded-full transition-colors ${showWax ? 'bg-ink-900' : 'bg-ink-200'}`}
                aria-pressed={showWax}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    showWax ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </span>
          </label>

          {/* Auto-open toggle */}
          <label className="flex cursor-pointer items-center justify-between rounded border border-ink-200 bg-white px-3 py-2 text-xs text-ink-700 hover:border-ink-400">
            <span>
              <span className="font-medium">Abrir automáticamente</span>
              <span className="block text-[10px] text-ink-400">
                Si está apagado, el invitado toca el sobre para abrirlo.
              </span>
            </span>
            <button
              type="button"
              onClick={() => onChange({ autoOpen: !autoOpen })}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${autoOpen ? 'bg-ink-900' : 'bg-ink-200'}`}
              aria-pressed={autoOpen}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  autoOpen ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>

          {/* Always show on reload toggle */}
          <label className="flex cursor-pointer items-center justify-between rounded border border-ink-200 bg-white px-3 py-2 text-xs text-ink-700 hover:border-ink-400">
            <span>
              <span className="font-medium">Mostrar siempre al recargar</span>
              <span className="block text-[10px] text-ink-400">
                Si está encendido, la animación del sobre se mostrará en cada visita o recarga.
              </span>
            </span>
            <button
              type="button"
              onClick={() => onChange({ alwaysShowOnReload: !alwaysShowOnReload })}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${alwaysShowOnReload ? 'bg-ink-900' : 'bg-ink-200'}`}
              aria-pressed={alwaysShowOnReload}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  alwaysShowOnReload ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>

          {/* Hint label */}
          <div>
            <label className="label-flat">Texto pista</label>
            <input
              type="text"
              value={hintLabel}
              onChange={(e) => onChange({ hintLabel: e.target.value })}
              placeholder="Toca para abrir"
              className="input-flat"
              maxLength={40}
            />
          </div>

          {/* Preview button */}
          <button
            type="button"
            onClick={triggerPreview}
            className="btn-flat w-full"
          >
            Ver vista previa
          </button>

          {previewNonce > 0 && (
            <EnvelopeIntroPreview
              key={previewNonce}
              config={{
                enabled: true,
                envelopeColor,
                liningColor,
                backgroundColor,
                recipientName,
                monogram,
                cardPreviewImage,
                wax: showWax,
                waxColor,
                hintLabel,
                autoOpen,
                alwaysShowOnReload,
              }}
              invitation={invitation}
              onClose={() => setPreviewNonce(0)}
            />
          )}
        </div>
      )}
    </div>
  )
}

/** Lazy-loaded preview overlay used by the editor's "Ver vista previa" button. */
function EnvelopeIntroPreview({
  config,
  invitation,
  onClose,
}: {
  config: EnvelopeIntroConfig
  invitation: Invitation
  onClose: () => void
}) {
  // Mount the production EnvelopeIntro component so the preview matches 1:1.
  // We hand it `demo` so it disappears immediately after the animation finishes.
  const [Comp, setComp] = useState<null | React.ComponentType<any>>(null)
  useEffect(() => {
    let cancelled = false
    import('../public/EnvelopeIntro').then((m) => {
      if (!cancelled) setComp(() => m.EnvelopeIntro)
    })
    return () => {
      cancelled = true
    }
  }, [])
  if (!Comp) return null
  return <Comp config={config} onDone={onClose} demo invitation={invitation} />
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label-flat">{label}</span>
      <span className="flex items-center gap-1.5 rounded border border-ink-200 bg-white px-2 py-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-5 w-6 shrink-0 cursor-pointer rounded border border-ink-200 bg-white"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 border-0 bg-transparent text-[11px] text-ink-700 focus:outline-none"
        />
      </span>
    </label>
  )
}

function SeasonsRow() {
  const variants = useEditorStore((s) => s.invitation.menuVariants)
  const editingId = useEditorStore((s) => s.invitation.editingVariantId)
  const activeId = useEditorStore((s) => s.invitation.activeVariantId)
  const enable = useEditorStore((s) => s.enableMenuVariants)
  const disable = useEditorStore((s) => s.disableMenuVariants)
  const add = useEditorStore((s) => s.addMenuVariant)
  const rename = useEditorStore((s) => s.renameMenuVariant)
  const remove = useEditorStore((s) => s.deleteMenuVariant)
  const setActive = useEditorStore((s) => s.setActiveMenuVariant)
  const switchEditing = useEditorStore((s) => s.switchEditingMenuVariant)

  const on = !!variants && variants.length > 0

  return (
    <div className="rounded border border-ink-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-ink-400">Temporadas</p>
          <p className="mt-0.5 text-[11px] text-ink-500">
            Crea varias versiones del menú (verano, invierno, brunch…). Los visitantes ven la temporada activa por defecto, pero pueden cambiar entre todas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (on) {
              if (!confirm('Se conservará solo la temporada activa y se eliminarán las demás. ¿Continuar?')) return
              disable()
            } else {
              enable()
            }
          }}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-ink-900' : 'bg-ink-200'}`}
          aria-pressed={on}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              on ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {on && variants && (
        <div className="mt-3 space-y-2">
          {variants.map((v) => {
            const isEditing = v.id === editingId
            const isActive = v.id === activeId
            return (
              <div
                key={v.id}
                className={`flex flex-col gap-2 rounded border px-2.5 py-2 text-xs ${
                  isEditing ? 'border-ink-900 bg-ink-50' : 'border-ink-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={v.label}
                    onChange={(e) => rename(v.id, e.target.value)}
                    className="flex-1 rounded border border-ink-200 bg-white px-2 py-1 text-xs focus:border-ink-400 focus:outline-none"
                  />
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => switchEditing(v.id)}
                      className="rounded border border-ink-200 px-2 py-1 text-[10px] uppercase tracking-widest text-ink-500 hover:border-ink-900 hover:text-ink-900"
                    >
                      Editar
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-ink-600">
                    <input
                      type="radio"
                      name="active-variant"
                      checked={isActive}
                      onChange={() => setActive(v.id)}
                      className="accent-ink-900"
                    />
                    Activa para el público
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (variants.length <= 1) return
                      if (!confirm(`¿Eliminar la temporada "${v.label}"?`)) return
                      remove(v.id)
                    }}
                    disabled={variants.length <= 1}
                    className="text-[10px] uppercase tracking-widest text-rose-500 hover:text-rose-700 disabled:opacity-30"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}

          <button
            type="button"
            onClick={() => {
              const label = prompt('Nombre de la nueva temporada:', `Temporada ${variants.length + 1}`)
              if (label === null) return
              const copy = confirm('¿Duplicar la temporada actual? (Cancelar = empezar vacía)')
              add(label, copy ? editingId : undefined)
            }}
            className="w-full rounded border border-dashed border-ink-300 px-2 py-2 text-[11px] uppercase tracking-widest text-ink-500 hover:border-ink-900 hover:text-ink-900"
          >
            + Añadir temporada
          </button>
        </div>
      )}
    </div>
  )
}
