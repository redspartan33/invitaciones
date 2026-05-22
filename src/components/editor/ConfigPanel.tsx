import { useEditorStore } from '../../store/editorStore'
import { useSelectedBlock } from '../../hooks/useSelectedBlock'
import { DynamicBlockForm } from '../forms/DynamicBlockForm'
import { BLOCK_CATALOG } from '../../utils/blockDefaults'
import type { FontFamily } from '../../types/invitation.types'

export function ConfigPanel() {
  const activePanel = useEditorStore((s) => s.activePanel)
  const selected = useSelectedBlock()
  const settings = useEditorStore((s) => s.invitation.globalSettings)
  const updateGlobalSettings = useEditorStore((s) => s.updateGlobalSettings)

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-l border-ink-200 bg-white">
      <PanelHeader />
      <div className="flex-1 overflow-y-auto p-5 scroll-thin">
        {activePanel === 'colors' ? (
          <ColorsPanel
            settings={settings}
            update={updateGlobalSettings}
          />
        ) : activePanel === 'fonts' ? (
          <FontsPanel font={settings.fontFamily} update={(f) => updateGlobalSettings({ fontFamily: f })} />
        ) : activePanel === 'music' ? (
          <MusicPanel
            value={settings.backgroundMusic ?? ''}
            update={(v) => updateGlobalSettings({ backgroundMusic: v })}
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
    </aside>
  )
}

function PanelHeader() {
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

function ColorsPanel({
  settings,
  update,
}: {
  settings: { colorPrimary: string; colorSecondary: string; colorAccent: string }
  update: (p: Partial<{ colorPrimary: string; colorSecondary: string; colorAccent: string }>) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-500">Estos colores se aplican a toda la invitación.</p>
      {[
        { key: 'colorPrimary' as const, label: 'Primario' },
        { key: 'colorSecondary' as const, label: 'Secundario' },
        { key: 'colorAccent' as const, label: 'Acento' },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="label-flat">{label}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings[key]}
              onChange={(e) => update({ [key]: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded border border-ink-200 bg-white"
            />
            <input
              type="text"
              value={settings[key]}
              onChange={(e) => update({ [key]: e.target.value })}
              className="input-flat"
            />
          </div>
        </div>
      ))}
      <div>
        <label className="label-flat">Paletas sugeridas</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Tierra', p: '#3c2f2f', s: '#f5efe6', a: '#b08968' },
            { name: 'Rosa', p: '#7a1f3d', s: '#fff0f5', a: '#e11d48' },
            { name: 'Bosque', p: '#1f3a2a', s: '#eef3ed', a: '#4a7c59' },
            { name: 'Marino', p: '#0f2a44', s: '#eaf0f6', a: '#3b82f6' },
          ].map((pal) => (
            <button
              key={pal.name}
              onClick={() =>
                update({ colorPrimary: pal.p, colorSecondary: pal.s, colorAccent: pal.a })
              }
              className="flex items-center gap-2 rounded border border-ink-200 bg-white p-2 text-left text-xs hover:border-ink-900"
            >
              <span className="flex">
                <span className="h-5 w-3" style={{ background: pal.p }} />
                <span className="h-5 w-3" style={{ background: pal.s }} />
                <span className="h-5 w-3" style={{ background: pal.a }} />
              </span>
              {pal.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FontsPanel({ font, update }: { font: FontFamily; update: (f: FontFamily) => void }) {
  const fonts: { value: FontFamily; label: string; sample: string; cls: string }[] = [
    { value: 'serif', label: 'Serif', sample: 'Ana & Juan', cls: 'font-serif text-3xl' },
    { value: 'sans-serif', label: 'Sans', sample: 'Ana & Juan', cls: 'font-sans text-3xl' },
    { value: 'script', label: 'Script', sample: 'Ana & Juan', cls: 'font-script text-4xl' },
  ]
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">Familia tipográfica para la invitación.</p>
      {fonts.map((f) => (
        <button
          key={f.value}
          onClick={() => update(f.value)}
          className={`flex w-full items-center justify-between rounded border px-4 py-3 text-left transition-colors ${
            font === f.value ? 'border-ink-900' : 'border-ink-200 hover:border-ink-400'
          }`}
        >
          <span className="text-xs uppercase tracking-widest text-ink-500">{f.label}</span>
          <span className={f.cls}>{f.sample}</span>
        </button>
      ))}
    </div>
  )
}

function MusicPanel({ value, update }: { value: string; update: (v: string) => void }) {
  const tracks = [
    { id: '', label: 'Sin música' },
    { id: 'classical', label: 'Clásica' },
    { id: 'acoustic', label: 'Acústica' },
    { id: 'jazz', label: 'Jazz suave' },
    { id: 'romantic', label: 'Romántica' },
  ]
  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-500">Música de fondo para la vista pública (demo).</p>
      {tracks.map((t) => (
        <button
          key={t.id || 'none'}
          onClick={() => update(t.id)}
          className={`flex w-full items-center justify-between rounded border px-4 py-3 text-left text-sm transition-colors ${
            value === t.id ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white hover:border-ink-400'
          }`}
        >
          {t.label}
          {value === t.id && <span className="text-xs">✓</span>}
        </button>
      ))}
    </div>
  )
}

function DetailsPanel() {
  const inv = useEditorStore((s) => s.invitation)
  const totalBlocks = inv.blocks.length
  const visible = inv.blocks.filter((b) => b.visible).length
  return (
    <div className="space-y-3 text-sm">
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
