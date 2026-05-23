import { useBlockForm } from '../../hooks/useBlockForm'
import { useEditorStore } from '../../store/editorStore'
import type { InvitationBlock, TextSize } from '../../types/invitation.types'
import { validateBlock } from '../../utils/blockValidation'
import { Field } from './Field'
import { TimelineItemsForm } from './TimelineItemsForm'
import { GiftRegistryItemsForm } from './GiftRegistryItemsForm'
import { GalleryImagesForm } from './GalleryImagesForm'
import { MenuItemsForm } from './MenuItemsForm'

// Field-kinds that render as visible text and therefore expose per-element
// size/color overrides under the input.
const TEXTUAL_KINDS = new Set(['text', 'textarea', 'date', 'time', 'email', 'url'])

const SIZES: TextSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

export function DynamicBlockForm({ block }: { block: InvitationBlock }) {
  const schema = useBlockForm(block.type)
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const updateBlockStyle = useEditorStore((s) => s.updateBlockStyle)
  const validation = validateBlock(block)

  const textStyles = block.style?.textStyles ?? {}

  const setElementStyle = (field: string, patch: { size?: TextSize | null; color?: string | null }) => {
    const current = textStyles[field] ?? {}
    const next = { ...current }
    if ('size' in patch) {
      if (patch.size === null) delete next.size
      else next.size = patch.size
    }
    if ('color' in patch) {
      if (patch.color === null) delete next.color
      else next.color = patch.color
    }
    const nextStyles = { ...textStyles }
    if (Object.keys(next).length === 0) delete nextStyles[field]
    else nextStyles[field] = next
    updateBlockStyle(block.id, { textStyles: nextStyles })
  }

  return (
    <div className="space-y-6">
      {schema.sections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">{section.title}</h3>
          <div className="space-y-3">
            {section.fields.map((field) => {
              const raw = (block.data as unknown as Record<string, unknown>)[field.name]
              const value =
                field.name === 'columns' && typeof raw === 'number' ? String(raw) : raw
              const showElementStyle = TEXTUAL_KINDS.has(field.kind) && !!(value as string)
              const override = textStyles[field.name]
              return (
                <div key={field.name} className="space-y-1.5">
                  <Field
                    field={field}
                    value={value}
                    error={validation.errors[field.name]}
                    onChange={(v) => {
                      const next = field.name === 'columns' ? Number(v) : v
                      if (field.name === 'stickyHeader' && next === true) {
                        updateBlockData(block.id, { stickyHeader: true, stickyNavOnly: false })
                        return
                      }
                      if (field.name === 'stickyNavOnly' && next === true) {
                        updateBlockData(block.id, { stickyHeader: false, stickyNavOnly: true })
                        return
                      }
                      updateBlockData(block.id, { [field.name]: next })
                    }}
                  />
                  {showElementStyle && (
                    <ElementStyleControls
                      field={field.name}
                      override={override}
                      onChangeSize={(s) => setElementStyle(field.name, { size: s })}
                      onChangeColor={(c) => setElementStyle(field.name, { color: c })}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {block.type === 'timeline' && <TimelineItemsForm block={block as InvitationBlock<'timeline'>} />}
      {block.type === 'gift-registry' && <GiftRegistryItemsForm block={block as InvitationBlock<'gift-registry'>} />}
      {block.type === 'gallery' && <GalleryImagesForm block={block as InvitationBlock<'gallery'>} />}
      {block.type === 'menu-section' && <MenuItemsForm block={block as InvitationBlock<'menu-section'>} />}

      {block.type === 'menu-section' && (
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Espaciado entre platillos</h3>
          <div className="grid grid-cols-5 gap-2">
            {SIZES.map((s) => {
              const current = ((block.data as { itemSpacing?: string }).itemSpacing ?? 'md')
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateBlockData(block.id, { itemSpacing: s })}
                  className={`rounded border px-2 py-2 text-xs uppercase tracking-widest transition-colors ${
                    current === s
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Estilos compartidos para campos repetibles (cuando aplica). */}
      {(block.type === 'timeline' || block.type === 'gift-registry') && (
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
            Estilo por elemento — items
          </h3>
          {block.type === 'timeline' && (
            <>
              <ItemStyleRow
                label="Hora del item"
                override={textStyles['items.time']}
                onChangeSize={(s) => setElementStyle('items.time', { size: s })}
                onChangeColor={(c) => setElementStyle('items.time', { color: c })}
              />
              <ItemStyleRow
                label="Título del item"
                override={textStyles['items.title']}
                onChangeSize={(s) => setElementStyle('items.title', { size: s })}
                onChangeColor={(c) => setElementStyle('items.title', { color: c })}
              />
              <ItemStyleRow
                label="Descripción del item"
                override={textStyles['items.description']}
                onChangeSize={(s) => setElementStyle('items.description', { size: s })}
                onChangeColor={(c) => setElementStyle('items.description', { color: c })}
              />
            </>
          )}
          {block.type === 'gift-registry' && (
            <>
              <ItemStyleRow
                label="Nombre de tienda"
                override={textStyles['items.storeName']}
                onChangeSize={(s) => setElementStyle('items.storeName', { size: s })}
                onChangeColor={(c) => setElementStyle('items.storeName', { color: c })}
              />
              <ItemStyleRow
                label="Descripción del regalo"
                override={textStyles['items.description']}
                onChangeSize={(s) => setElementStyle('items.description', { size: s })}
                onChangeColor={(c) => setElementStyle('items.description', { color: c })}
              />
            </>
          )}
        </section>
      )}

      {(block.type === 'event-details' || block.type === 'timeline') && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Iconos</h3>
          <label className="flex items-center justify-between gap-3 rounded border border-ink-200 bg-white px-3 py-2 text-sm">
            <span className="text-ink-700">Ocultar iconos del bloque</span>
            <button
              type="button"
              onClick={() => updateBlockStyle(block.id, { hideIcons: !block.style?.hideIcons })}
              className={`relative h-5 w-9 rounded-full transition-colors ${block.style?.hideIcons ? 'bg-ink-900' : 'bg-ink-200'}`}
              aria-pressed={!!block.style?.hideIcons}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${block.style?.hideIcons ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </button>
          </label>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Tamaño de texto</h3>
        <div className="grid grid-cols-5 gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateBlockStyle(block.id, { textSize: s })}
              className={`rounded border px-2 py-2 text-xs uppercase tracking-widest transition-colors ${
                (block.style?.textSize ?? 'md') === s
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Espaciado</h3>
        <div className="grid grid-cols-4 gap-2">
          {(['sm', 'md', 'lg', 'xl'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => updateBlockStyle(block.id, { paddingY: p })}
              className={`rounded border px-2 py-2 text-xs uppercase tracking-widest transition-colors ${
                (block.style?.paddingY ?? 'lg') === p
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function ElementStyleControls({
  field,
  override,
  onChangeSize,
  onChangeColor,
}: {
  field: string
  override?: { size?: TextSize; color?: string }
  onChangeSize: (s: TextSize | null) => void
  onChangeColor: (c: string | null) => void
}) {
  const activeSize = override?.size
  const activeColor = override?.color
  const hasOverride = !!activeSize || !!activeColor
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded border border-dashed border-ink-200 px-2 py-1.5">
      <span className="mr-1 text-[10px] uppercase tracking-widest text-ink-400">Estilo</span>
      <div className="flex gap-1">
        {SIZES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChangeSize(activeSize === s ? null : s)}
            title={`Tamaño ${s.toUpperCase()}`}
            className={`h-6 w-6 rounded border text-[10px] uppercase transition-colors ${
              activeSize === s
                ? 'border-ink-900 bg-ink-900 text-white'
                : 'border-ink-200 bg-white text-ink-500 hover:border-ink-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <label
        className="ml-1 inline-flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded border border-ink-200"
        title="Color del texto"
      >
        <input
          type="color"
          value={activeColor || '#000000'}
          onChange={(e) => onChangeColor(e.target.value)}
          className="h-8 w-8 cursor-pointer border-0 bg-transparent p-0"
          aria-label={`Color de ${field}`}
        />
      </label>
      {hasOverride && (
        <button
          type="button"
          onClick={() => {
            onChangeSize(null)
            onChangeColor(null)
          }}
          title="Restablecer"
          className="ml-auto text-[10px] uppercase tracking-widest text-ink-500 hover:text-rose-600"
        >
          reset
        </button>
      )}
    </div>
  )
}

function ItemStyleRow({
  label,
  override,
  onChangeSize,
  onChangeColor,
}: {
  label: string
  override?: { size?: TextSize; color?: string }
  onChangeSize: (s: TextSize | null) => void
  onChangeColor: (c: string | null) => void
}) {
  return (
    <div className="space-y-1">
      <label className="label-flat">{label}</label>
      <ElementStyleControls field={label} override={override} onChangeSize={onChangeSize} onChangeColor={onChangeColor} />
    </div>
  )
}
