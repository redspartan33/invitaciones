import { useRef } from 'react'
import { useEditorStore } from '../../store/editorStore'
import type {
  Alignment,
  FontFamily,
  ImageElementData,
  InvitationBlock,
  ShapeElementData,
  TextElementData,
} from '../../types/invitation.types'
import { ENTRY_ANIMATION_GROUPS } from '../blocks/AnimatedBlock'
import type { EntryAnimation } from '../../types/invitation.types'

/** Property panel for the free-form elements: text, image, shape. */
export function ElementForm({ block }: { block: InvitationBlock }) {
  if (block.type === 'text') return <TextForm block={block as InvitationBlock<'text'>} />
  if (block.type === 'image') return <ImageForm block={block as InvitationBlock<'image'>} />
  if (block.type === 'shape') return <ShapeForm block={block as InvitationBlock<'shape'>} />
  return null
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">{title}</h3>
      {children}
    </section>
  )
}

function EntryAnimationSelect({ block }: { block: InvitationBlock }) {
  const updateBlockStyle = useEditorStore((s) => s.updateBlockStyle)
  const value = block.style?.entryAnimation ?? 'none'
  return (
    <Section title="Animación de entrada">
      <select
        value={value}
        onChange={(e) => updateBlockStyle(block.id, { entryAnimation: e.target.value as EntryAnimation })}
        className="input-flat"
      >
        {ENTRY_ANIMATION_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </Section>
  )
}

const ALIGNMENTS: { value: Alignment; label: string }[] = [
  { value: 'left', label: 'Izq' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Der' },
]

const FAMILIES: { value: FontFamily | 'inherit'; label: string }[] = [
  { value: 'inherit', label: 'Heredar' },
  { value: 'serif', label: 'Serif' },
  { value: 'sans-serif', label: 'Sans' },
  { value: 'script', label: 'Script' },
]

function TextForm({ block }: { block: InvitationBlock<'text'> }) {
  const update = useEditorStore((s) => s.updateBlockData)
  const d = block.data
  const set = (patch: Partial<TextElementData>) => update(block.id, patch as Record<string, unknown>)

  return (
    <div className="space-y-6">
      <Section title="Texto">
        <textarea
          value={d.text}
          onChange={(e) => set({ text: e.target.value })}
          rows={3}
          className="input-flat w-full"
          placeholder="Escribe tu texto…"
        />
      </Section>

      <Section title="Tipografía">
        <div>
          <label className="label-flat">Fuente</label>
          <div className="grid grid-cols-4 gap-1.5">
            {FAMILIES.map((f) => (
              <Toggle key={f.value} active={(d.fontFamily ?? 'inherit') === f.value} onClick={() => set({ fontFamily: f.value })}>
                {f.label}
              </Toggle>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between label-flat">
            <span>Tamaño</span>
            <span className="text-[10px] font-mono text-ink-400">{d.fontSize ?? 48}px</span>
          </div>
          <input
            type="range"
            min={10}
            max={220}
            value={d.fontSize ?? 48}
            onChange={(e) => set({ fontSize: Number(e.target.value) })}
            className="w-full accent-ink-900"
          />
        </div>
        <div>
          <label className="label-flat">Alineación</label>
          <div className="grid grid-cols-3 gap-1.5">
            {ALIGNMENTS.map((a) => (
              <Toggle key={a.value} active={(d.align ?? 'center') === a.value} onClick={() => set({ align: a.value })}>
                {a.label}
              </Toggle>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5">
          <Toggle active={!!d.bold} onClick={() => set({ bold: !d.bold })}>
            <span className="font-bold">B</span>
          </Toggle>
          <Toggle active={!!d.italic} onClick={() => set({ italic: !d.italic })}>
            <span className="italic">I</span>
          </Toggle>
          <Toggle active={!!d.uppercase} onClick={() => set({ uppercase: !d.uppercase })}>
            AA
          </Toggle>
        </div>
        <ColorRow label="Color" value={d.color ?? '#18181b'} onChange={(c) => set({ color: c })} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label-flat">Interlineado</label>
            <input
              type="number"
              step={0.05}
              min={0.8}
              value={d.lineHeight ?? 1.25}
              onChange={(e) => set({ lineHeight: Number(e.target.value) })}
              className="input-flat w-full"
            />
          </div>
          <div>
            <label className="label-flat">Espaciado (em)</label>
            <input
              type="number"
              step={0.01}
              value={d.letterSpacing ?? 0}
              onChange={(e) => set({ letterSpacing: Number(e.target.value) })}
              className="input-flat w-full"
            />
          </div>
        </div>
      </Section>

      <EntryAnimationSelect block={block} />
    </div>
  )
}

function ImageForm({ block }: { block: InvitationBlock<'image'> }) {
  const update = useEditorStore((s) => s.updateBlockData)
  const d = block.data
  const set = (patch: Partial<ImageElementData>) => update(block.id, patch as Record<string, unknown>)
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB (máx 2 MB). Usa una más ligera o pega una URL pública.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => set({ url: String(reader.result) })
    reader.readAsDataURL(file)
  }
  const urlValue = d.url?.startsWith('data:') ? '' : (d.url ?? '')

  return (
    <div className="space-y-6">
      <Section title="Imagen">
        <div className="flex gap-2">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => set({ url: e.target.value })}
            placeholder="Pega URL o sube archivo →"
            className="input-flat flex-1"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded border border-ink-200 bg-white px-3 py-2 text-xs uppercase tracking-widest text-ink-600 hover:border-ink-400"
          >
            Subir
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
              e.target.value = ''
            }}
          />
        </div>
        {d.url && (
          <div className="relative mt-2 overflow-hidden rounded border border-ink-200 bg-ink-50">
            <img src={d.url} alt="" className="block h-28 w-full object-contain" />
            <button
              type="button"
              onClick={() => set({ url: '' })}
              className="absolute right-2 top-2 rounded bg-white/90 px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink-700 hover:bg-white"
            >
              Quitar
            </button>
          </div>
        )}
      </Section>

      <Section title="Apariencia">
        <div>
          <label className="label-flat">Ajuste</label>
          <div className="grid grid-cols-2 gap-1.5">
            <Toggle active={(d.fit ?? 'cover') === 'cover'} onClick={() => set({ fit: 'cover' })}>
              Rellenar
            </Toggle>
            <Toggle active={d.fit === 'contain'} onClick={() => set({ fit: 'contain' })}>
              Contener
            </Toggle>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between label-flat">
            <span>Esquinas</span>
            <span className="text-[10px] font-mono text-ink-400">{d.radius ?? 0}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            value={d.radius ?? 0}
            onChange={(e) => set({ radius: Number(e.target.value) })}
            className="w-full accent-ink-900"
          />
        </div>
        <OpacityRow value={d.opacity ?? 100} onChange={(v) => set({ opacity: v })} />
      </Section>

      <EntryAnimationSelect block={block} />
    </div>
  )
}

function ShapeForm({ block }: { block: InvitationBlock<'shape'> }) {
  const update = useEditorStore((s) => s.updateBlockData)
  const d = block.data
  const set = (patch: Partial<ShapeElementData>) => update(block.id, patch as Record<string, unknown>)

  return (
    <div className="space-y-6">
      <Section title="Forma">
        <div className="grid grid-cols-3 gap-1.5">
          <Toggle active={d.shape === 'rectangle'} onClick={() => set({ shape: 'rectangle' })}>
            Rect
          </Toggle>
          <Toggle active={d.shape === 'ellipse'} onClick={() => set({ shape: 'ellipse' })}>
            Círculo
          </Toggle>
          <Toggle active={d.shape === 'line'} onClick={() => set({ shape: 'line' })}>
            Línea
          </Toggle>
        </div>
      </Section>

      <Section title="Apariencia">
        {d.shape !== 'line' && (
          <ColorRow label="Relleno" value={d.fill ?? '#b08968'} onChange={(c) => set({ fill: c })} clearable onClear={() => set({ fill: '' })} />
        )}
        <ColorRow
          label={d.shape === 'line' ? 'Color' : 'Borde'}
          value={d.stroke || d.fill || '#000000'}
          onChange={(c) => set({ stroke: c })}
        />
        <div>
          <div className="flex items-center justify-between label-flat">
            <span>{d.shape === 'line' ? 'Grosor' : 'Grosor del borde'}</span>
            <span className="text-[10px] font-mono text-ink-400">{d.strokeWidth ?? 0}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={40}
            value={d.strokeWidth ?? 0}
            onChange={(e) => set({ strokeWidth: Number(e.target.value) })}
            className="w-full accent-ink-900"
          />
        </div>
        {d.shape === 'rectangle' && (
          <div>
            <div className="flex items-center justify-between label-flat">
              <span>Esquinas</span>
              <span className="text-[10px] font-mono text-ink-400">{d.radius ?? 0}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              value={d.radius ?? 0}
              onChange={(e) => set({ radius: Number(e.target.value) })}
              className="w-full accent-ink-900"
            />
          </div>
        )}
        <OpacityRow value={d.opacity ?? 100} onChange={(v) => set({ opacity: v })} />
      </Section>

      <EntryAnimationSelect block={block} />
    </div>
  )
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-2 text-xs uppercase tracking-widest transition-colors ${
        active ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
      }`}
    >
      {children}
    </button>
  )
}

function ColorRow({
  label,
  value,
  onChange,
  clearable,
  onClear,
}: {
  label: string
  value: string
  onChange: (c: string) => void
  clearable?: boolean
  onClear?: () => void
}) {
  return (
    <div>
      <label className="label-flat">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-ink-200 bg-white"
        />
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="input-flat flex-1"
        />
        {clearable && (
          <button type="button" onClick={onClear} className="btn-ghost text-rose-600" title="Sin relleno">
            ×
          </button>
        )}
      </div>
    </div>
  )
}

function OpacityRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between label-flat">
        <span>Opacidad</span>
        <span className="text-[10px] font-mono text-ink-400">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-ink-900"
      />
    </div>
  )
}
