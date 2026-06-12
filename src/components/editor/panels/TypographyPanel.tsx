import { useEffect, useState } from 'react'
import type {
  FontFamily,
  FontRef,
  FontSlotIndex,
  GlobalSettings,
  TextRole,
  TypographySettings,
} from '../../../types/invitation.types'
import {
  TEXT_ROLES,
  resolveFontSlots,
  typographyLegacyFields,
} from '../../../utils/themeVars'
import { loadFullFont, loadPreviewFont } from '../../../hooks/useFontLoader'
import { FontPicker } from './FontPicker'

const TEXT_ROLE_LABELS: Record<TextRole, string> = {
  heading: 'Títulos',
  subheading: 'Subtítulos',
  body: 'Cuerpo',
  date: 'Fechas',
  button: 'Botones',
  accentText: 'Texto decorativo',
}

/** Roles whose size multiplier is wired to --inv-size-* in index.css. */
const SIZABLE_ROLES: TextRole[] = ['heading', 'subheading', 'body', 'date', 'button']

const SLOT_LABELS = ['Fuente 1', 'Fuente 2', 'Fuente 3'] as const

export function TypographyPanel({
  settings,
  update,
}: {
  settings: GlobalSettings
  update: (patch: Partial<GlobalSettings>) => void
}) {
  const [pickingSlot, setPickingSlot] = useState<FontSlotIndex | null>(null)

  const slots = resolveFontSlots(settings)
  const typography: TypographySettings = settings.typography ?? {
    slots,
    roleAssignments: {},
    sizes: {},
  }

  // Make sure assigned fonts render inside the panel cards too.
  useEffect(() => {
    slots.forEach((ref) => {
      if (ref) loadPreviewFont(ref, ref.family)
    })
  }, [slots])

  const save = (next: TypographySettings) => {
    update({ typography: next, ...typographyLegacyFields(settings, next) })
  }

  const setSlot = (index: FontSlotIndex, ref: FontRef | null) => {
    if (ref) loadFullFont(ref)
    const nextSlots = [...typography.slots] as TypographySettings['slots']
    nextSlots[index] = ref
    save({ ...typography, slots: nextSlots })
  }

  const assignRole = (role: TextRole, slot: FontSlotIndex) => {
    save({
      ...typography,
      roleAssignments: { ...typography.roleAssignments, [role]: slot },
    })
  }

  const setSize = (role: TextRole, value: number) => {
    save({ ...typography, sizes: { ...typography.sizes, [role]: value } })
  }

  if (pickingSlot !== null) {
    return (
      <FontPicker
        current={typography.slots[pickingSlot]}
        onClose={() => setPickingSlot(null)}
        onPick={(ref) => {
          setSlot(pickingSlot, ref)
          setPickingSlot(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-ink-500">
        Define hasta 3 tipografías y decide qué textos de la invitación usa cada una.
      </p>

      {/* ─── Slots ─── */}
      <div className="space-y-2">
        {SLOT_LABELS.map((label, i) => {
          const idx = i as FontSlotIndex
          const ref = typography.slots[idx]
          return (
            <div key={label} className="rounded border border-ink-200 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-400">
                  {label}
                </span>
                <span className="flex items-center gap-2">
                  {ref && (
                    <button
                      type="button"
                      onClick={() => setSlot(idx, null)}
                      className="text-[10px] uppercase tracking-widest text-ink-400 hover:text-rose-600"
                    >
                      Quitar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPickingSlot(idx)}
                    className="text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
                  >
                    {ref ? 'Cambiar' : 'Elegir'}
                  </button>
                </span>
              </div>
              {ref ? (
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="truncate text-2xl" style={{ fontFamily: `"${ref.family}"` }}>
                    {ref.family}
                  </span>
                  <span className="shrink-0 text-[9px] uppercase tracking-widest text-ink-400">
                    {ref.provider === 'fontshare' ? 'Fontshare' : 'Google'}
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-xs text-ink-400">Sin definir</p>
              )}
            </div>
          )
        })}
      </div>

      {/* ─── Mapeo de textos ─── */}
      <div>
        <label className="label-flat">Textos de la invitación</label>
        <p className="mb-2 text-[11px] leading-snug text-ink-400">
          Asigna una de tus 3 fuentes a cada tipo de texto y ajusta su tamaño.
        </p>
        <div className="divide-y divide-ink-100 rounded border border-ink-200">
          {TEXT_ROLES.map((role) => {
            const assigned = typography.roleAssignments[role]
            const size = typography.sizes?.[role] ?? 1
            return (
              <div key={role} className="space-y-2 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-ink-700">{TEXT_ROLE_LABELS[role]}</span>
                  <span className="flex overflow-hidden rounded border border-ink-200">
                    {([0, 1, 2] as FontSlotIndex[]).map((slot) => {
                      const slotFont = typography.slots[slot]
                      const isActive = assigned === slot
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={!slotFont}
                          title={slotFont ? slotFont.family : 'Slot sin definir'}
                          onClick={() => assignRole(role, slot)}
                          className={`px-2.5 py-1 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            isActive
                              ? 'bg-ink-900 text-on-accent'
                              : 'bg-surface text-ink-600 hover:bg-ink-50'
                          }`}
                        >
                          {slot + 1}
                        </button>
                      )
                    })}
                  </span>
                </div>
                {SIZABLE_ROLES.includes(role) && (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0.7}
                      max={1.6}
                      step={0.05}
                      value={size}
                      onChange={(e) => setSize(role, Number(e.target.value))}
                      className="w-full accent-ink-900"
                    />
                    <span className="w-10 shrink-0 text-right font-mono text-[10px] text-ink-500">
                      {size.toFixed(2)}×
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Modo simple (legacy) ─── */}
      <details className="rounded border border-ink-200 px-3 py-2">
        <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-widest text-ink-500">
          Modo simple
        </summary>
        <SimpleFontMode
          font={settings.fontFamily}
          update={(f) => update({ fontFamily: f })}
        />
      </details>
    </div>
  )
}

function SimpleFontMode({
  font,
  update,
}: {
  font: FontFamily
  update: (f: FontFamily) => void
}) {
  const fonts: { value: FontFamily; label: string; cls: string }[] = [
    { value: 'serif', label: 'Serif', cls: 'font-serif text-2xl' },
    { value: 'sans-serif', label: 'Sans', cls: 'font-sans text-2xl' },
    { value: 'script', label: 'Script', cls: 'font-script text-3xl' },
  ]
  return (
    <div className="mt-2 space-y-2">
      <p className="text-[11px] leading-snug text-ink-400">
        Familia base usada cuando no hay fuentes personalizadas definidas.
      </p>
      {fonts.map((f) => (
        <button
          key={f.value}
          onClick={() => update(f.value)}
          className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left transition-colors ${
            font === f.value ? 'border-ink-900' : 'border-ink-200 hover:border-ink-400'
          }`}
        >
          <span className="text-xs uppercase tracking-widest text-ink-500">{f.label}</span>
          <span className={f.cls}>Ana & Juan</span>
        </button>
      ))}
    </div>
  )
}
