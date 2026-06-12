import { useState } from 'react'
import type {
  ColorRole,
  GlobalSettings,
  PaletteSettings,
} from '../../../types/invitation.types'
import {
  COLOR_ROLES,
  paletteLegacyFields,
  resolveColorRoles,
  seedPaletteFromLegacy,
} from '../../../utils/themeVars'
import {
  COLOR_ROLE_LABELS,
  CURATED_PALETTES,
  paletteFromCurated,
} from '../../../data/palettes'

const SAVED_COLORS_KEY = 'invitation-builder:saved-colors'
const MAX_SWATCHES = 6
const MIN_SWATCHES = 3

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

export function PalettePanel({
  settings,
  update,
}: {
  settings: GlobalSettings
  update: (patch: Partial<GlobalSettings>) => void
}) {
  const [expandedRole, setExpandedRole] = useState<ColorRole | null>(null)
  const [savedColors, setSavedColors] = useState<string[]>(() => loadSavedColors())

  const activePalette: PaletteSettings = settings.palette ?? seedPaletteFromLegacy(settings)
  const resolved = resolveColorRoles(settings)
  const isCustom = activePalette.presetId === 'custom' || !activePalette.presetId

  const apply = (palette: PaletteSettings) => {
    update({ palette, ...paletteLegacyFields(settings, palette) })
  }

  const applyCurated = (id: string) => {
    const curated = CURATED_PALETTES.find((p) => p.id === id)
    if (curated) apply(paletteFromCurated(curated))
  }

  const duplicateAsCustom = () => {
    apply({ ...activePalette, presetId: 'custom' })
  }

  const setSwatch = (index: number, hex: string) => {
    const swatches = [...activePalette.swatches]
    swatches[index] = hex
    apply({ ...activePalette, presetId: 'custom', swatches })
  }

  const addSwatch = (hex = '#cccccc') => {
    if (activePalette.swatches.length >= MAX_SWATCHES) return
    apply({
      ...activePalette,
      presetId: 'custom',
      swatches: [...activePalette.swatches, hex],
    })
  }

  const removeSwatch = (index: number) => {
    if (activePalette.swatches.length <= MIN_SWATCHES) return
    const swatches = activePalette.swatches.filter((_, i) => i !== index)
    // Re-point roles that referenced the removed/shifted swatches.
    const roleAssignments: Partial<Record<ColorRole, number>> = {}
    for (const [role, idx] of Object.entries(activePalette.roleAssignments) as [ColorRole, number][]) {
      if (idx === index) roleAssignments[role] = 0
      else if (idx > index) roleAssignments[role] = idx - 1
      else roleAssignments[role] = idx
    }
    apply({ ...activePalette, presetId: 'custom', swatches, roleAssignments })
  }

  const assignRole = (role: ColorRole, swatchIndex: number) => {
    apply({
      ...activePalette,
      roleAssignments: { ...activePalette.roleAssignments, [role]: swatchIndex },
    })
  }

  const saveColor = (hex: string) => {
    const c = hex.toLowerCase()
    if (savedColors.includes(c)) return
    const next = [c, ...savedColors].slice(0, 24)
    setSavedColors(next)
    persistSavedColors(next)
  }

  const removeSavedColor = (hex: string) => {
    const next = savedColors.filter((c) => c !== hex)
    setSavedColors(next)
    persistSavedColors(next)
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-ink-500">
        Elige una paleta completa y decide qué color de la paleta usa cada elemento de la invitación.
      </p>

      {/* ─── Paletas curadas ─── */}
      <div>
        <label className="label-flat">Paletas</label>
        <div className="space-y-2">
          {CURATED_PALETTES.map((p) => {
            const isActive = activePalette.presetId === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyCurated(p.id)}
                className={`flex w-full items-center gap-3 rounded border px-3 py-2 transition-colors ${
                  isActive ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-400'
                }`}
              >
                <span className="flex flex-1 overflow-hidden rounded">
                  {p.swatches.map((hex, i) => (
                    <span key={i} className="h-6 flex-1" style={{ background: hex }} />
                  ))}
                </span>
                <span className={`w-32 shrink-0 text-left text-xs ${isActive ? 'font-medium text-ink-900' : 'text-ink-600'}`}>
                  {p.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Mi paleta ─── */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="label-flat mb-0">Mi paleta</label>
          {!isCustom && (
            <button
              type="button"
              onClick={duplicateAsCustom}
              className="text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
            >
              Editar como propia
            </button>
          )}
        </div>
        {isCustom ? (
          <>
            <div className="flex flex-wrap gap-2">
              {activePalette.swatches.map((hex, i) => (
                <div key={i} className="group relative">
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) => setSwatch(i, e.target.value)}
                    title={hex}
                    className="h-10 w-12 cursor-pointer rounded border border-ink-200 bg-surface p-0.5"
                  />
                  {activePalette.swatches.length > MIN_SWATCHES && (
                    <button
                      type="button"
                      onClick={() => removeSwatch(i)}
                      aria-label="Quitar color"
                      className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-ink-200 bg-surface text-[10px] leading-none text-ink-600 opacity-0 transition-opacity group-hover:opacity-100 hover:border-rose-400 hover:text-rose-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {activePalette.swatches.length < MAX_SWATCHES && (
                <button
                  type="button"
                  onClick={() => addSwatch()}
                  title="Añadir color"
                  className="btn-flat h-10 w-12 p-0 text-base"
                >
                  +
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {activePalette.swatches.map((hex, i) => (
                <button
                  key={`${hex}-${i}`}
                  type="button"
                  onClick={() => saveColor(hex)}
                  className="rounded border border-ink-200 px-1.5 py-0.5 font-mono text-[10px] text-ink-500 hover:border-ink-900 hover:text-ink-900"
                  title="Guardar en mis colores"
                >
                  {hex}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[11px] text-ink-400">
            Estás usando una paleta curada. Pulsa «Editar como propia» para personalizar sus colores.
          </p>
        )}
      </div>

      {/* ─── Elementos de la invitación ─── */}
      <div>
        <label className="label-flat">Elementos de la invitación</label>
        <p className="mb-2 text-[11px] leading-snug text-ink-400">
          Toca un elemento y elige qué color de la paleta se le aplica.
        </p>
        <div className="divide-y divide-ink-100 rounded border border-ink-200">
          {COLOR_ROLES.map((role) => {
            const isOpen = expandedRole === role
            const assignedIdx = activePalette.roleAssignments[role]
            return (
              <div key={role}>
                <button
                  type="button"
                  onClick={() => setExpandedRole(isOpen ? null : role)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-ink-50"
                >
                  <span className="text-xs text-ink-700">{COLOR_ROLE_LABELS[role]}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-ink-400">{resolved[role]}</span>
                    <span
                      className="h-5 w-5 rounded-full border border-ink-200"
                      style={{ background: resolved[role] }}
                    />
                  </span>
                </button>
                {isOpen && (
                  <div className="flex flex-wrap gap-2 bg-ink-50 px-3 py-2.5">
                    {activePalette.swatches.map((hex, i) => (
                      <button
                        key={`${hex}-${i}`}
                        type="button"
                        title={hex}
                        onClick={() => assignRole(role, i)}
                        className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          assignedIdx === i ? 'border-ink-900' : 'border-ink-200'
                        }`}
                        style={{ background: hex }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Mis colores guardados ─── */}
      <div>
        <label className="label-flat">Mis colores guardados</label>
        {savedColors.length === 0 ? (
          <p className="text-[11px] text-ink-400">
            Aún no tienes colores guardados. Toca un hex de tu paleta para guardarlo.
          </p>
        ) : (
          <div className="grid grid-cols-6 gap-2">
            {savedColors.map((hex) => (
              <div key={hex} className="group relative">
                <button
                  type="button"
                  title={isCustom ? `${hex} · añadir a mi paleta` : hex}
                  onClick={() => addSwatch(hex)}
                  disabled={!isCustom || activePalette.swatches.length >= MAX_SWATCHES}
                  className="h-9 w-full rounded border border-ink-200 transition-transform hover:scale-105 hover:border-ink-900 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: hex }}
                />
                <button
                  type="button"
                  onClick={() => removeSavedColor(hex)}
                  aria-label="Eliminar color"
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-ink-200 bg-surface text-[10px] leading-none text-ink-600 opacity-0 transition-opacity group-hover:opacity-100 hover:border-rose-400 hover:text-rose-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {savedColors.length > 0 && isCustom && (
          <p className="mt-1 text-[10px] text-ink-400">Toca un color para añadirlo a tu paleta.</p>
        )}
      </div>
    </div>
  )
}
