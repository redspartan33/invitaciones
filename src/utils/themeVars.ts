import type {
  ColorRole,
  FontRef,
  GlobalSettings,
  PaletteSettings,
  TextRole,
  TypographySettings,
} from '../types/invitation.types'

/**
 * Single source of truth for the invitation theme. Resolves the role-based
 * palette/typography (with fallback to the legacy colorPrimary/headingFont
 * fields for invitations saved before roles existed) into the CSS variables
 * consumed inside `.invitation-canvas`. Used identically by the editor
 * canvases and the public view, so both always render the same.
 */

export const COLOR_ROLES: ColorRole[] = [
  'background',
  'heading',
  'subheading',
  'body',
  'date',
  'icon',
  'button',
  'link',
  'divider',
]

export const TEXT_ROLES: TextRole[] = [
  'heading',
  'subheading',
  'body',
  'date',
  'button',
  'accentText',
]

/** Which slot each text role uses when the user hasn't assigned one. */
const DEFAULT_ROLE_SLOT: Record<TextRole, 0 | 1 | 2> = {
  heading: 0,
  subheading: 0,
  body: 1,
  date: 1,
  button: 1,
  accentText: 2,
}

/** Legacy invitations (no `typography`): everything except headings renders
 *  with the body font today, so the defaults must reproduce that exactly. */
const LEGACY_ROLE_SLOT: Record<TextRole, 0 | 1 | 2> = {
  heading: 0,
  subheading: 1,
  body: 1,
  date: 1,
  button: 1,
  accentText: 1,
}

/** Legacy mapping: which of the 3 old colors each role falls back to. */
const LEGACY_ROLE_SOURCE: Record<ColorRole, 'primary' | 'secondary' | 'accent'> = {
  background: 'secondary',
  heading: 'primary',
  subheading: 'accent',
  body: 'primary',
  date: 'primary',
  icon: 'accent',
  button: 'primary',
  link: 'accent',
  divider: 'accent',
}

export function resolveColorRoles(settings: GlobalSettings): Record<ColorRole, string> {
  const legacy = {
    primary: settings.colorPrimary,
    secondary: settings.colorSecondary,
    accent: settings.colorAccent,
  }
  const palette = settings.palette
  const out = {} as Record<ColorRole, string>
  for (const role of COLOR_ROLES) {
    const idx = palette?.roleAssignments?.[role]
    const swatch = idx != null ? palette?.swatches?.[idx] : undefined
    out[role] = swatch || legacy[LEGACY_ROLE_SOURCE[role]]
  }
  return out
}

/** Slots resolved with legacy fallback: slot0 ← headingFont, slot1 ← bodyFont. */
export function resolveFontSlots(
  settings: GlobalSettings,
): [FontRef | null, FontRef | null, FontRef | null] {
  const t = settings.typography
  const legacyHeading: FontRef | null = settings.headingFont
    ? { family: settings.headingFont, provider: 'google' }
    : null
  const legacyBody: FontRef | null = settings.bodyFont
    ? { family: settings.bodyFont, provider: 'google' }
    : null
  return [
    t?.slots?.[0] ?? legacyHeading,
    t?.slots?.[1] ?? legacyBody,
    t?.slots?.[2] ?? null,
  ]
}

export function resolveTextRoleFonts(
  settings: GlobalSettings,
): Partial<Record<TextRole, FontRef>> {
  const slots = resolveFontSlots(settings)
  const hasTypography = !!settings.typography
  const defaults = hasTypography ? DEFAULT_ROLE_SLOT : LEGACY_ROLE_SLOT
  const assignments = settings.typography?.roleAssignments
  const out: Partial<Record<TextRole, FontRef>> = {}
  for (const role of TEXT_ROLES) {
    const slotIdx = assignments?.[role] ?? defaults[role]
    const font = slots[slotIdx] ?? slots[defaults[role]]
    if (font) out[role] = font
  }
  return out
}

/** Every distinct font the invitation needs loaded (slots, deduped). */
export function collectThemeFonts(settings: GlobalSettings): FontRef[] {
  const seen = new Set<string>()
  const fonts: FontRef[] = []
  for (const ref of resolveFontSlots(settings)) {
    if (!ref?.family?.trim()) continue
    const key = `${ref.provider}:${ref.family}`
    if (seen.has(key)) continue
    seen.add(key)
    fonts.push(ref)
  }
  return fonts
}

const fontValue = (ref?: FontRef) => (ref ? `"${ref.family}"` : undefined)

/**
 * CSS variables for `.invitation-canvas`. Emits both the role vars
 * (--inv-*) and the legacy vars (--color-*, --font-*) with the same
 * resolved values so older CSS rules keep working.
 */
export function buildThemeVars(settings: GlobalSettings): Record<string, string> {
  const colors = resolveColorRoles(settings)
  const roleFonts = resolveTextRoleFonts(settings)
  const sizes = settings.typography?.sizes

  const vars: Record<string, string | undefined> = {
    '--inv-bg': colors.background,
    '--inv-heading': colors.heading,
    '--inv-subheading': colors.subheading,
    '--inv-body': colors.body,
    '--inv-date': colors.date,
    '--inv-icon': colors.icon,
    '--inv-button': colors.button,
    '--inv-link': colors.link,
    '--inv-divider': colors.divider,
    '--inv-font-heading': fontValue(roleFonts.heading),
    '--inv-font-subheading': fontValue(roleFonts.subheading),
    '--inv-font-body': fontValue(roleFonts.body),
    '--inv-font-date': fontValue(roleFonts.date),
    '--inv-font-button': fontValue(roleFonts.button),
    '--inv-font-accent': fontValue(roleFonts.accentText),
    '--inv-size-heading': sizes?.heading != null ? String(sizes.heading) : undefined,
    '--inv-size-subheading': sizes?.subheading != null ? String(sizes.subheading) : undefined,
    '--inv-size-body': sizes?.body != null ? String(sizes.body) : undefined,
    '--inv-size-date': sizes?.date != null ? String(sizes.date) : undefined,
    '--inv-size-button': sizes?.button != null ? String(sizes.button) : undefined,
    // Legacy vars — same resolved values, so .primary-bg, the envelope
    // intro and any old rule keep rendering correctly.
    '--color-primary': colors.heading,
    '--color-secondary': colors.background,
    '--color-accent': colors.icon,
    '--font-heading': fontValue(roleFonts.heading),
    '--font-body': fontValue(roleFonts.body),
  }

  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(vars)) {
    if (v != null) out[k] = v
  }
  return out
}

/**
 * Legacy fields kept in sync when saving from the new panels, so anything
 * still reading colorPrimary/headingFont (templates, old viewers) works.
 */
export function paletteLegacyFields(
  settings: GlobalSettings,
  palette: PaletteSettings,
): Pick<GlobalSettings, 'colorPrimary' | 'colorSecondary' | 'colorAccent'> {
  const colors = resolveColorRoles({ ...settings, palette })
  return {
    colorPrimary: colors.heading,
    colorSecondary: colors.background,
    colorAccent: colors.icon,
  }
}

export function typographyLegacyFields(
  settings: GlobalSettings,
  typography: TypographySettings,
): Pick<GlobalSettings, 'headingFont' | 'bodyFont'> {
  const roleFonts = resolveTextRoleFonts({ ...settings, typography })
  return {
    headingFont: roleFonts.heading?.family ?? settings.headingFont,
    bodyFont: roleFonts.body?.family ?? settings.bodyFont,
  }
}

/** Seed a custom palette from the legacy 3 colors (for old invitations). */
export function seedPaletteFromLegacy(settings: GlobalSettings): PaletteSettings {
  return {
    presetId: 'custom',
    swatches: [settings.colorPrimary, settings.colorSecondary, settings.colorAccent],
    roleAssignments: {
      heading: 0,
      body: 0,
      date: 0,
      button: 0,
      background: 1,
      subheading: 2,
      icon: 2,
      link: 2,
      divider: 2,
    },
  }
}
