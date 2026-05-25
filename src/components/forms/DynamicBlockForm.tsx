import { useRef } from 'react'
import { useBlockForm, type BlockFormField } from '../../hooks/useBlockForm'
import { useEditorStore } from '../../store/editorStore'
import type { InvitationBlock, TextSize } from '../../types/invitation.types'
import { validateBlock } from '../../utils/blockValidation'
import { resolveFieldOrder } from '../../utils/fieldOrder'
import { initGuestList } from '../../utils/guestlistClient'
import { Field } from './Field'
import { TimelineItemsForm } from './TimelineItemsForm'
import { GiftRegistryItemsForm } from './GiftRegistryItemsForm'
import { GalleryImagesForm } from './GalleryImagesForm'
import { ImageSetImagesForm } from './ImageSetImagesForm'
import { MenuItemsForm } from './MenuItemsForm'
import { MenuNavItemsForm } from './MenuNavItemsForm'
import { DragHandle, SortableItem, SortableList } from './SortableItem'
import { ENTRY_ANIMATION_GROUPS } from '../blocks/AnimatedBlock'
import type { EntryAnimation } from '../../types/invitation.types'

// Field-kinds that render as visible text and therefore expose per-element
// size/color overrides under the input.
const TEXTUAL_KINDS = new Set(['text', 'textarea', 'date', 'time', 'email', 'url'])

const SIZES: TextSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

export function DynamicBlockForm({ block }: { block: InvitationBlock }) {
  const schema = useBlockForm(block.type)
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const updateBlockStyle = useEditorStore((s) => s.updateBlockStyle)
  const validation = validateBlock(block)
  const hasCustomPadding = block.style?.paddingTop !== undefined || block.style?.paddingBottom !== undefined

  const textStyles = block.style?.textStyles ?? {}

  const setElementStyle = (
    field: string,
    patch: { size?: TextSize | null; color?: string | null; bold?: boolean | null; italic?: boolean | null },
  ) => {
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
    if ('bold' in patch) {
      if (patch.bold === null || patch.bold === false) delete next.bold
      else next.bold = true
    }
    if ('italic' in patch) {
      if (patch.italic === null || patch.italic === false) delete next.italic
      else next.italic = true
    }
    const nextStyles = { ...textStyles }
    if (Object.keys(next).length === 0) delete nextStyles[field]
    else nextStyles[field] = next
    updateBlockStyle(block.id, { textStyles: nextStyles })
  }

  // Render the controls (input + element-style toolbar) for a single schema
  // field. Pulled into a helper so we can render the same field either
  // standalone or inside a SortableItem wrapper.
  const renderFieldBody = (field: BlockFormField) => {
    const raw = (block.data as unknown as Record<string, unknown>)[field.name]
    const trueByDefault =
      block.type === 'event-details' && (field.name === 'showDate' || field.name === 'showTime')
    const normalized = trueByDefault && raw === undefined ? true : raw
    const value = field.name === 'columns' && typeof normalized === 'number' ? String(normalized) : normalized
    const showElementStyle = TEXTUAL_KINDS.has(field.kind) && !!(value as string)
    const override = textStyles[field.name]
    return (
      <>
        <Field
          field={field}
          value={value}
          error={validation.errors[field.name]}
          onChange={async (v) => {
            const next = field.name === 'columns' ? Number(v) : v
            if (field.name === 'stickyHeader' && next === true) {
              updateBlockData(block.id, { stickyHeader: true, stickyNavOnly: false })
              return
            }
            if (field.name === 'stickyNavOnly' && next === true) {
              updateBlockData(block.id, { stickyHeader: false, stickyNavOnly: true })
              return
            }
            if (field.name === 'useRsvpForm') {
              const enabled = !!next
              if (enabled) {
                const curr = (block.data as Record<string, unknown>)['guestListSlug'] as string | undefined
                if (!curr) {
                  const makeSlug = () => {
                    const r = Math.random().toString(36).slice(2, 8)
                    const t = Date.now().toString(36).slice(-4)
                    return `${r}${t}`
                  }
                  const slug = makeSlug()
                  const link = `${window.location.origin}/?guestlist=${slug}`
                  await initGuestList(slug)
                  updateBlockData(block.id, { useRsvpForm: true, guestListSlug: slug, guestListLink: link })
                  return
                }
              }
              updateBlockData(block.id, { useRsvpForm: enabled })
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
            onToggleBold={() => setElementStyle(field.name, { bold: !override?.bold })}
            onToggleItalic={() => setElementStyle(field.name, { italic: !override?.italic })}
          />
        )}
      </>
    )
  }

  const useRsvpForm = !!((block.data as Record<string, unknown>)['useRsvpForm'])
  const whatsappFields = new Set(['rsvpLink', 'whatsappPhone', 'whatsappMessage', 'whatsappButtonLabel'])

  // Reorder a subset of fieldOrder by moving `fromId` to `toId`'s slot. The
  // section keys outside this slice are kept untouched so reordering one
  // section doesn't disturb the user's choices in other sections.
  const reorderInSection = (sectionFieldNames: string[], fromId: string, toId: string) => {
    const fromIdx = sectionFieldNames.indexOf(fromId)
    const toIdx = sectionFieldNames.indexOf(toId)
    if (fromIdx === -1 || toIdx === -1) return
    const next = [...sectionFieldNames]
    const [m] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, m)
    const existing = block.style?.fieldOrder ?? []
    const otherKept = existing.filter((k) => !sectionFieldNames.includes(k))
    updateBlockStyle(block.id, { fieldOrder: [...otherKept, ...next] })
  }

  return (
    <div className="space-y-6">
      {schema.sections.map((section) => {
        const visible = section.fields.filter((f) => !(useRsvpForm && whatsappFields.has(f.name)))
        const textualFields = visible.filter((f) => TEXTUAL_KINDS.has(f.kind))
        const nonTextual = visible.filter((f) => !TEXTUAL_KINDS.has(f.kind))
        const textualNames = textualFields.map((f) => f.name)
        // Resolve display order from style.fieldOrder for the textual subset.
        const sortedTextual = resolveFieldOrder(textualNames, block.style?.fieldOrder)
          .map((name) => textualFields.find((f) => f.name === name))
          .filter((f): f is BlockFormField => !!f)
        const canSort = textualFields.length >= 2
        return (
          <section key={section.title} className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">{section.title}</h3>
              {canSort && (
                <span className="text-[10px] uppercase tracking-widest text-ink-400">arrastra ⠿</span>
              )}
            </div>
            {nonTextual.length > 0 && (
              <div className="space-y-3">
                {nonTextual.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    {renderFieldBody(field)}
                  </div>
                ))}
              </div>
            )}
            {sortedTextual.length > 0 && (
              canSort ? (
                <SortableList
                  ids={sortedTextual.map((f) => f.name)}
                  onReorder={(fromId, toId) => reorderInSection(sortedTextual.map((f) => f.name), fromId, toId)}
                >
                  <div className="space-y-3">
                    {sortedTextual.map((field) => (
                      <SortableItem key={field.name} id={field.name}>
                        {({ handleProps }) => (
                          <div className="flex items-start gap-2 rounded border border-transparent bg-white p-1">
                            <DragHandle handleProps={handleProps} />
                            <div className="min-w-0 flex-1 space-y-1.5">
                              {renderFieldBody(field)}
                            </div>
                          </div>
                        )}
                      </SortableItem>
                    ))}
                  </div>
                </SortableList>
              ) : (
                <div className="space-y-3">
                  {sortedTextual.map((field) => (
                    <div key={field.name} className="space-y-1.5">
                      {renderFieldBody(field)}
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        )
      })}

      {/* Guestlist link preview when RSVP form is active */}
      {Boolean((block.data as Record<string, unknown>)['useRsvpForm']) && (
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Guestlist público</h3>
          <div className="rounded-3xl border border-ink-200 bg-white px-4 py-4 shadow-sm shadow-ink-200/10">
            <p className="text-sm text-ink-600">Copiar este link para compartir con tu cliente y ver quién ha confirmado.</p>
            {Boolean((block.data as Record<string, unknown>)['guestListLink']) ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  readOnly
                  value={String((block.data as Record<string, unknown>)['guestListLink'])}
                  className="input-flat flex-1"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(String((block.data as Record<string, unknown>)['guestListLink']))}
                  className="btn-primary whitespace-nowrap"
                >
                  Copiar link
                </button>
              </div>
            ) : (
              <div className="mt-2 text-sm text-ink-500">Generando link…</div>
            )}
          </div>
        </section>
      )}

      {block.type === 'timeline' && <TimelineItemsForm block={block as InvitationBlock<'timeline'>} />}
      {block.type === 'gift-registry' && <GiftRegistryItemsForm block={block as InvitationBlock<'gift-registry'>} />}
      {block.type === 'gallery' && <GalleryImagesForm block={block as InvitationBlock<'gallery'>} />}
      {block.type === 'image-set' && <ImageSetImagesForm block={block as InvitationBlock<'image-set'>} />}
      {block.type === 'menu-section' && <MenuItemsForm block={block as InvitationBlock<'menu-section'>} />}
      {block.type === 'menu-header' && <MenuNavItemsForm block={block as InvitationBlock<'menu-header'>} />}

      <EntryAnimationSection
        value={block.style?.entryAnimation ?? 'none'}
        onChange={(v) => updateBlockStyle(block.id, { entryAnimation: v })}
      />

      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
          Separación entre elementos internos
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {SIZES.map((s) => {
            // Read from style.itemSpacing (universal). Fall back to legacy
            // data.itemSpacing on menu-section blocks so old menus keep their
            // saved value until the user touches the control.
            const fromStyle = block.style?.itemSpacing
            const legacy =
              block.type === 'menu-section'
                ? ((block.data as { itemSpacing?: string }).itemSpacing as TextSize | undefined)
                : undefined
            const current = fromStyle ?? legacy ?? 'md'
            return (
              <button
                key={s}
                type="button"
                onClick={() => updateBlockStyle(block.id, { itemSpacing: s })}
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

      {/* Estilos compartidos para campos repetibles (cuando aplica). */}
      {(block.type === 'timeline' || block.type === 'gift-registry') && (
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
            Estilo por elemento — items
          </h3>
          {block.type === 'timeline' && (
            <>
              {(['items.time', 'items.title', 'items.description'] as const).map((key) => (
                <ItemStyleRow
                  key={key}
                  label={
                    key === 'items.time'
                      ? 'Hora del item'
                      : key === 'items.title'
                      ? 'Título del item'
                      : 'Descripción del item'
                  }
                  override={textStyles[key]}
                  onChangeSize={(s) => setElementStyle(key, { size: s })}
                  onChangeColor={(c) => setElementStyle(key, { color: c })}
                  onToggleBold={() => setElementStyle(key, { bold: !textStyles[key]?.bold })}
                  onToggleItalic={() => setElementStyle(key, { italic: !textStyles[key]?.italic })}
                />
              ))}
            </>
          )}
          {block.type === 'gift-registry' && (
            <>
              {(['items.storeName', 'items.description'] as const).map((key) => (
                <ItemStyleRow
                  key={key}
                  label={key === 'items.storeName' ? 'Nombre de tienda' : 'Descripción del regalo'}
                  override={textStyles[key]}
                  onChangeSize={(s) => setElementStyle(key, { size: s })}
                  onChangeColor={(c) => setElementStyle(key, { color: c })}
                  onToggleBold={() => setElementStyle(key, { bold: !textStyles[key]?.bold })}
                  onToggleItalic={() => setElementStyle(key, { italic: !textStyles[key]?.italic })}
                />
              ))}
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
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Espaciado vertical</h3>

        {/* Predefined quick presets */}
        <div>
          <label className="label-flat">Ajuste rápido (Predefinido)</label>
          <div className="grid grid-cols-4 gap-2">
            {(['sm', 'md', 'lg', 'xl'] as const).map((p) => {
              const active = !hasCustomPadding && (block.style?.paddingY ?? 'lg') === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateBlockStyle(block.id, { paddingY: p, paddingTop: undefined, paddingBottom: undefined })}
                  className={`rounded border px-2 py-2 text-xs uppercase tracking-widest transition-colors ${
                    active
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
                  }`}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom pixel sliders and inputs */}
        <div className="space-y-3 rounded border border-ink-200 bg-white p-3">
          <div>
            <div className="flex items-center justify-between label-flat">
              <span>Espaciado superior</span>
              <span className="text-[10px] font-mono text-ink-400">
                {block.style?.paddingTop !== undefined ? `${block.style.paddingTop}px` : 'Por defecto'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={200}
                value={block.style?.paddingTop ?? 80}
                onChange={(e) => updateBlockStyle(block.id, { paddingTop: Number(e.target.value) })}
                className="flex-1 accent-ink-900"
              />
              <input
                type="number"
                min={0}
                max={500}
                value={block.style?.paddingTop !== undefined ? block.style.paddingTop : ''}
                placeholder="Auto"
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : Number(e.target.value)
                  updateBlockStyle(block.id, { paddingTop: val })
                }}
                className="input-flat w-16 text-center py-1 px-1.5"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between label-flat">
              <span>Espaciado inferior</span>
              <span className="text-[10px] font-mono text-ink-400">
                {block.style?.paddingBottom !== undefined ? `${block.style.paddingBottom}px` : 'Por defecto'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={200}
                value={block.style?.paddingBottom ?? 80}
                onChange={(e) => updateBlockStyle(block.id, { paddingBottom: Number(e.target.value) })}
                className="flex-1 accent-ink-900"
              />
              <input
                type="number"
                min={0}
                max={500}
                value={block.style?.paddingBottom !== undefined ? block.style.paddingBottom : ''}
                placeholder="Auto"
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : Number(e.target.value)
                  updateBlockStyle(block.id, { paddingBottom: val })
                }}
                className="input-flat w-16 text-center py-1 px-1.5"
              />
            </div>
          </div>

          {hasCustomPadding && (
            <button
              type="button"
              onClick={() => updateBlockStyle(block.id, { paddingTop: undefined, paddingBottom: undefined })}
              className="text-[10px] uppercase tracking-widest text-rose-600 hover:underline"
            >
              Restablecer a predefinido
            </button>
          )}
        </div>
      </section>

      <BlockBackgroundSection
        backgroundColor={block.style?.backgroundColor}
        backgroundImage={block.style?.backgroundImage}
        backgroundPosition={block.style?.backgroundPosition}
        backgroundSize={block.style?.backgroundSize}
        onChange={(patch) => updateBlockStyle(block.id, patch)}
      />

      <BorderRadiusSection
        value={block.style?.borderRadius ?? 'none'}
        onChange={(v) => updateBlockStyle(block.id, { borderRadius: v })}
      />
    </div>
  )
}

const RADIUS_OPTIONS: { value: NonNullable<import('../../types/invitation.types').BlockStyle['borderRadius']>; label: string }[] = [
  { value: 'none', label: 'Recto' },
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
  { value: 'xl', label: 'XL' },
  { value: '2xl', label: '2XL' },
]

function BorderRadiusSection({
  value,
  onChange,
}: {
  value: NonNullable<import('../../types/invitation.types').BlockStyle['borderRadius']>
  onChange: (v: NonNullable<import('../../types/invitation.types').BlockStyle['borderRadius']>) => void
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
        Esquinas redondeadas
      </h3>
      <div className="grid grid-cols-6 gap-2">
        {RADIUS_OPTIONS.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`rounded border px-1.5 py-2 text-[10px] uppercase tracking-widest transition-colors ${
                active
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
              }`}
              title={opt.value}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-ink-400">
        Aplica al contenedor del bloque. En el bloque de mapa también redondea el iframe del mapa.
      </p>
    </section>
  )
}

const BG_POSITIONS: { value: NonNullable<import('../../types/invitation.types').BlockStyle['backgroundPosition']>; label: string }[] = [
  { value: 'top-left', label: '↖' },
  { value: 'top', label: '↑' },
  { value: 'top-right', label: '↗' },
  { value: 'left', label: '←' },
  { value: 'center', label: '•' },
  { value: 'right', label: '→' },
  { value: 'bottom-left', label: '↙' },
  { value: 'bottom', label: '↓' },
  { value: 'bottom-right', label: '↘' },
]

function BlockBackgroundSection({
  backgroundColor,
  backgroundImage,
  backgroundPosition,
  backgroundSize,
  onChange,
}: {
  backgroundColor?: string
  backgroundImage?: string
  backgroundPosition?: import('../../types/invitation.types').BlockStyle['backgroundPosition']
  backgroundSize?: import('../../types/invitation.types').BlockStyle['backgroundSize']
  onChange: (patch: {
    backgroundColor?: string
    backgroundImage?: string
    backgroundPosition?: import('../../types/invitation.types').BlockStyle['backgroundPosition']
    backgroundSize?: import('../../types/invitation.types').BlockStyle['backgroundSize']
  }) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const onFile = (file: File) => {
    // 2 MB raw → ~2.7 MB base64 → ~2.8 MB JSON body, well under Vercel's
    // 4.5 MB body limit. Conservative on purpose because production has
    // been rejecting larger payloads with opaque 500s.
    if (file.size > 2 * 1024 * 1024) {
      alert(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB (máx 2 MB). Usa una más ligera o pega una URL pública.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange({ backgroundImage: String(reader.result) })
    reader.readAsDataURL(file)
  }
  const urlValue = backgroundImage?.startsWith('data:') ? '' : (backgroundImage ?? '')
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Fondo del bloque</h3>

      <div>
        <label className="label-flat">Color de fondo</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={backgroundColor || '#ffffff'}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            className="h-9 w-12 cursor-pointer rounded border border-ink-200 bg-white"
          />
          <input
            type="text"
            value={backgroundColor ?? ''}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            placeholder="#ffffff"
            className="input-flat"
          />
          {backgroundColor && (
            <button
              type="button"
              onClick={() => onChange({ backgroundColor: '' })}
              className="btn-ghost text-rose-600"
              title="Quitar color"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="label-flat">Imagen de fondo</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => onChange({ backgroundImage: e.target.value })}
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
        {backgroundImage && (
          <div className="relative mt-2 overflow-hidden rounded border border-ink-200 bg-ink-50">
            <img src={backgroundImage} alt="" className="block h-28 w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange({ backgroundImage: '' })}
              className="absolute right-2 top-2 rounded bg-white/90 px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink-700 hover:bg-white"
            >
              Quitar
            </button>
          </div>
        )}
        <p className="mt-1 text-[11px] text-ink-400">
          La imagen se aplica a todo el bloque. Si también defines un color, la imagen va encima.
        </p>
      </div>

      {backgroundImage && (
        <>
          <div>
            <label className="label-flat">Ajuste de la imagen</label>
            <div className="grid grid-cols-3 gap-2">
              {(['cover', 'contain', 'auto'] as const).map((s) => {
                const active = (backgroundSize ?? 'cover') === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChange({ backgroundSize: s })}
                    className={`rounded border px-2 py-2 text-[11px] uppercase tracking-widest transition-colors ${
                      active
                        ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
                    }`}
                    title={
                      s === 'cover'
                        ? 'Rellena todo el bloque (puede recortar)'
                        : s === 'contain'
                        ? 'Cabe completa (puede dejar espacio)'
                        : 'Tamaño original'
                    }
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="label-flat">Posición de la imagen</label>
            <div className="grid grid-cols-3 gap-1.5">
              {BG_POSITIONS.map((p) => {
                const active = (backgroundPosition ?? 'center') === p.value
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => onChange({ backgroundPosition: p.value })}
                    title={p.value}
                    className={`flex h-9 items-center justify-center rounded border text-base transition-colors ${
                      active
                        ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-ink-200 bg-white text-ink-500 hover:border-ink-400'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function ElementStyleControls({
  field,
  override,
  onChangeSize,
  onChangeColor,
  onToggleBold,
  onToggleItalic,
}: {
  field: string
  override?: { size?: TextSize; color?: string; bold?: boolean; italic?: boolean }
  onChangeSize: (s: TextSize | null) => void
  onChangeColor: (c: string | null) => void
  onToggleBold?: () => void
  onToggleItalic?: () => void
}) {
  const activeSize = override?.size
  const activeColor = override?.color
  const activeBold = !!override?.bold
  const activeItalic = !!override?.italic
  const hasOverride = !!activeSize || !!activeColor || activeBold || activeItalic
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
      {onToggleBold && (
        <button
          type="button"
          onClick={onToggleBold}
          title="Negrita"
          className={`h-6 w-6 rounded border text-[11px] font-bold transition-colors ${
            activeBold
              ? 'border-ink-900 bg-ink-900 text-white'
              : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
          }`}
          aria-pressed={activeBold}
        >
          B
        </button>
      )}
      {onToggleItalic && (
        <button
          type="button"
          onClick={onToggleItalic}
          title="Cursiva"
          className={`h-6 w-6 rounded border text-[11px] italic transition-colors ${
            activeItalic
              ? 'border-ink-900 bg-ink-900 text-white'
              : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
          }`}
          aria-pressed={activeItalic}
        >
          I
        </button>
      )}
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
            if (activeBold) onToggleBold?.()
            if (activeItalic) onToggleItalic?.()
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

function EntryAnimationSection({
  value,
  onChange,
}: {
  value: EntryAnimation
  onChange: (v: EntryAnimation) => void
}) {
  const totalCount = ENTRY_ANIMATION_GROUPS.reduce(
    (n, g) => n + g.options.length - (g.options[0]?.value === 'none' ? 1 : 0),
    0,
  )
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
          Animación de entrada
        </h3>
        <span className="text-[10px] uppercase tracking-widest text-ink-400">
          {totalCount} efectos
        </span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as EntryAnimation)}
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
      {value !== 'none' && (
        <button
          type="button"
          onClick={() => {
            // Replay: toggle to 'none' then back to retrigger the framer key.
            onChange('none')
            setTimeout(() => onChange(value), 30)
          }}
          className="btn-flat w-full"
        >
          ↻ Volver a reproducir
        </button>
      )}
      <p className="text-[11px] text-ink-400">
        Se reproduce cuando el bloque entra a la pantalla del invitado.
      </p>
    </section>
  )
}

function ItemStyleRow({
  label,
  override,
  onChangeSize,
  onChangeColor,
  onToggleBold,
  onToggleItalic,
}: {
  label: string
  override?: { size?: TextSize; color?: string; bold?: boolean; italic?: boolean }
  onChangeSize: (s: TextSize | null) => void
  onChangeColor: (c: string | null) => void
  onToggleBold?: () => void
  onToggleItalic?: () => void
}) {
  return (
    <div className="space-y-1">
      <label className="label-flat">{label}</label>
      <ElementStyleControls
        field={label}
        override={override}
        onChangeSize={onChangeSize}
        onChangeColor={onChangeColor}
        onToggleBold={onToggleBold}
        onToggleItalic={onToggleItalic}
      />
    </div>
  )
}
