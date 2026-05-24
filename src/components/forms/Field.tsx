import { useRef } from 'react'
import type { BlockFormField } from '../../hooks/useBlockForm'

interface FieldProps {
  field: BlockFormField
  value: unknown
  onChange: (value: unknown) => void
  error?: string
}

export function Field({ field, value, onChange, error }: FieldProps) {
  const id = `f-${field.name}`
  return (
    <div>
      {field.kind !== 'toggle' && (
        <label htmlFor={id} className="label-flat">
          {field.label}
        </label>
      )}
      {renderInput(field, value, onChange, id, !!error)}
      {field.helper && !error && <p className="mt-1 text-xs text-ink-400">{field.helper}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  )
}

function renderInput(
  field: BlockFormField,
  value: unknown,
  onChange: (v: unknown) => void,
  id: string,
  invalid: boolean,
) {
  const cls = `input-flat ${invalid ? 'border-rose-500' : ''}`
  switch (field.kind) {
    case 'textarea':
      return (
        <textarea
          id={id}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={cls}
        />
      )
    case 'select':
      return (
        <select id={id} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={cls}>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    case 'toggle':
      return (
        <label className="flex items-center justify-between gap-3 rounded border border-ink-200 bg-white px-3 py-2 text-sm">
          <span className="text-ink-700">{field.label}</span>
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={`relative h-5 w-9 rounded-full transition-colors ${value ? 'bg-ink-900' : 'bg-ink-200'}`}
            aria-pressed={!!value}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`}
            />
          </button>
        </label>
      )
    case 'color':
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            id={id}
            value={(value as string) || '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-ink-200 bg-white"
          />
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={cls}
            placeholder="#ffffff"
          />
        </div>
      )
    case 'image':
      return <ImageField id={id} value={value as string} onChange={onChange} cls={cls} />

    case 'date':
    case 'time':
    case 'email':
    case 'url':
    case 'text':
    default:
      return (
        <input
          type={field.kind === 'text' ? 'text' : field.kind}
          id={id}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )
  }
}

function ImageField({
  id,
  value,
  onChange,
  cls,
}: {
  id: string
  value: string | undefined
  onChange: (v: unknown) => void
  cls: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const v = value ?? ''

  const onFile = (file: File) => {
    // Keep source under 2.5 MB so the publish-time upload to /api/assets
    // (base64) fits under Vercel's 4.5 MB serverless body limit.
    if (file.size > 2.5 * 1024 * 1024) {
      alert(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB (máx 2.5 MB). Usa una más ligera o pega una URL pública.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="url"
          id={id}
          value={v.startsWith('data:') ? '' : v}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pega URL o sube archivo →"
          className={`${cls} flex-1`}
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
      {v && (
        <div className="relative overflow-hidden rounded border border-ink-200 bg-ink-50">
          <img src={v} alt="" className="block h-28 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 rounded bg-white/90 px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink-700 hover:bg-white"
          >
            Quitar
          </button>
        </div>
      )}
    </div>
  )
}
