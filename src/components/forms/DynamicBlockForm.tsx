import { useBlockForm } from '../../hooks/useBlockForm'
import { useEditorStore } from '../../store/editorStore'
import type { InvitationBlock } from '../../types/invitation.types'
import { validateBlock } from '../../utils/blockValidation'
import { Field } from './Field'
import { TimelineItemsForm } from './TimelineItemsForm'
import { GiftRegistryItemsForm } from './GiftRegistryItemsForm'
import { GalleryImagesForm } from './GalleryImagesForm'

export function DynamicBlockForm({ block }: { block: InvitationBlock }) {
  const schema = useBlockForm(block.type)
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const updateBlockStyle = useEditorStore((s) => s.updateBlockStyle)
  const validation = validateBlock(block)

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
              return (
                <Field
                  key={field.name}
                  field={field}
                  value={value}
                  error={validation.errors[field.name]}
                  onChange={(v) => {
                    const next =
                      field.name === 'columns' ? Number(v) : v
                    updateBlockData(block.id, { [field.name]: next })
                  }}
                />
              )
            })}
          </div>
        </section>
      ))}

      {block.type === 'timeline' && <TimelineItemsForm block={block as InvitationBlock<'timeline'>} />}
      {block.type === 'gift-registry' && <GiftRegistryItemsForm block={block as InvitationBlock<'gift-registry'>} />}
      {block.type === 'gallery' && <GalleryImagesForm block={block as InvitationBlock<'gallery'>} />}

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
