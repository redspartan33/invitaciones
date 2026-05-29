import { useEditorStore } from '../../store/editorStore'
import type { ElementLayout, InvitationBlock } from '../../types/invitation.types'
import { defaultLayoutFor } from '../../utils/blockDefaults'

/** Position / size / rotation / layer controls for an element on a fixed
 *  canvas. All values are percentages of the canvas (except rotation, deg). */
export function TransformControls({ block }: { block: InvitationBlock }) {
  const updateLayout = useEditorStore((s) => s.updateBlockLayout)
  const bringToFront = useEditorStore((s) => s.bringToFront)
  const sendToBack = useEditorStore((s) => s.sendToBack)
  const l: ElementLayout = block.layout ?? defaultLayoutFor(block.type)

  const num = (v: number) => Math.round(v * 10) / 10

  return (
    <section className="mb-6 space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
        Posición y tamaño
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X %" value={num(l.xPct)} onChange={(v) => updateLayout(block.id, { xPct: v })} />
        <NumberField label="Y %" value={num(l.yPct)} onChange={(v) => updateLayout(block.id, { yPct: v })} />
        <NumberField label="Ancho %" value={num(l.wPct)} min={1} onChange={(v) => updateLayout(block.id, { wPct: v })} />
        <NumberField label="Alto %" value={num(l.hPct)} min={1} onChange={(v) => updateLayout(block.id, { hPct: v })} />
      </div>

      <div>
        <div className="flex items-center justify-between label-flat">
          <span>Rotación</span>
          <span className="text-[10px] font-mono text-ink-400">{Math.round(l.rotation ?? 0)}°</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={-180}
            max={180}
            value={l.rotation ?? 0}
            onChange={(e) => updateLayout(block.id, { rotation: Number(e.target.value) })}
            className="flex-1 accent-ink-900"
          />
          <button
            type="button"
            onClick={() => updateLayout(block.id, { rotation: 0 })}
            className="rounded border border-ink-200 px-2 py-1 text-[10px] uppercase tracking-widest text-ink-500 hover:border-ink-400"
          >
            0°
          </button>
        </div>
      </div>

      <div>
        <label className="label-flat">Capa</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => bringToFront(block.id)}
            className="rounded border border-ink-200 bg-white px-2 py-2 text-xs text-ink-600 hover:border-ink-400"
          >
            Traer al frente
          </button>
          <button
            type="button"
            onClick={() => sendToBack(block.id)}
            className="rounded border border-ink-200 bg-white px-2 py-2 text-xs text-ink-600 hover:border-ink-400"
          >
            Enviar al fondo
          </button>
        </div>
      </div>

      <label className="flex items-center justify-between gap-3 rounded border border-ink-200 bg-white px-3 py-2 text-sm">
        <span className="text-ink-700">Bloquear posición</span>
        <button
          type="button"
          onClick={() => updateLayout(block.id, { locked: !l.locked })}
          className={`relative h-5 w-9 rounded-full transition-colors ${l.locked ? 'bg-ink-900' : 'bg-ink-200'}`}
          aria-pressed={!!l.locked}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${l.locked ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </button>
      </label>
    </section>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
}) {
  return (
    <div>
      <label className="label-flat">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input-flat w-full"
      />
    </div>
  )
}
