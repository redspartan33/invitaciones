import { useState } from 'react'
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
        ) : activePanel === 'api' ? (
          <ApiPanel />
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
  else if (activePanel === 'api') title = 'API / Backend'
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
    { url: '', label: 'Sin música' },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', label: 'Clásica' },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', label: 'Acústica' },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', label: 'Jazz suave' },
    { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', label: 'Romántica' },
  ]
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">
        Música de fondo para la vista pública. Los invitados verán un botón para activarla
        (los navegadores bloquean el autoplay sin interacción).
      </p>
      {tracks.map((t) => (
        <button
          key={t.url || 'none'}
          onClick={() => update(t.url)}
          className={`flex w-full items-center justify-between rounded border px-4 py-3 text-left text-sm transition-colors ${
            value === t.url ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white hover:border-ink-400'
          }`}
        >
          {t.label}
          {value === t.url && <span className="text-xs">✓</span>}
        </button>
      ))}
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
    </div>
  )
}

function ApiPanel() {
  const backend = useEditorStore((s) => s.backend)
  const setBackend = useEditorStore((s) => s.setBackend)
  const testBackend = useEditorStore((s) => s.testBackend)
  const publishMode = useEditorStore((s) => s.publishMode)
  const publishError = useEditorStore((s) => s.publishError)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)

  const onTest = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await testBackend()
    setTestResult(result)
    setTesting(false)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-500">
        Conecta un backend propio para guardar las invitaciones de verdad. Al publicar,
        la app envía un <code className="rounded bg-ink-100 px-1 py-0.5 text-[10px]">PUT</code> al endpoint
        y la vista pública hace <code className="rounded bg-ink-100 px-1 py-0.5 text-[10px]">GET</code>.
      </p>

      <div>
        <label className="label-flat">URL base del API</label>
        <input
          type="url"
          value={backend.baseUrl}
          onChange={(e) => setBackend({ baseUrl: e.target.value })}
          placeholder="https://api.lamartinasma.com"
          className="input-flat"
        />
        <p className="mt-1 text-xs text-ink-400">
          Sin slash final. La app llamará a <code>{(backend.baseUrl || 'https://...').replace(/\/$/, '')}/invitations/&lt;id&gt;</code>
        </p>
      </div>

      <div>
        <label className="label-flat">Token / API key (opcional)</label>
        <input
          type="password"
          value={backend.token}
          onChange={(e) => setBackend({ token: e.target.value })}
          placeholder="sk_..."
          className="input-flat"
        />
        <p className="mt-1 text-xs text-ink-400">
          Si lo configuras, se envía como <code>Authorization: Bearer &lt;token&gt;</code>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onTest} className="btn-flat" disabled={testing || !backend.baseUrl}>
          {testing ? 'Probando…' : 'Probar conexión'}
        </button>
        {testResult && (
          <span className={`text-xs ${testResult.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
            {testResult.message}
          </span>
        )}
      </div>

      {publishMode !== 'idle' && (
        <div
          className={`rounded border p-3 text-xs ${
            publishMode === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : publishMode === 'pushed'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-ink-200 bg-ink-50 text-ink-700'
          }`}
        >
          {publishMode === 'pushing' && 'Enviando al backend…'}
          {publishMode === 'pushed' && '✓ Invitación enviada al backend'}
          {publishMode === 'error' && `Error: ${publishError ?? 'desconocido'}`}
        </div>
      )}

      <div className="divider" />

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Contrato esperado</p>
        <p className="mt-2 text-xs text-ink-600">El backend debe responder en estos endpoints:</p>
        <pre className="mt-2 overflow-x-auto rounded border border-ink-200 bg-ink-50 p-3 text-[11px] leading-relaxed text-ink-700">
{`PUT    /invitations/<id>   { Invitation JSON }
GET    /invitations/<id>   → Invitation JSON
DELETE /invitations/<id>
GET    /health             → 200 OK`}
        </pre>
        <p className="mt-2 text-xs text-ink-500">
          Sin backend, la publicación sigue funcionando con localStorage + link portable.
        </p>
      </div>
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
