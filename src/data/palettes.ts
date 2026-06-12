import type { ColorRole, PaletteSettings } from '../types/invitation.types'

export interface CuratedPalette {
  id: string
  name: string
  swatches: string[]
  roleAssignments: Partial<Record<ColorRole, number>>
}

/**
 * Default role layout for 5-swatch palettes:
 *   [0] texto principal · [1] fondo · [2] acento · [3] acento suave · [4] detalle
 */
const STD: Partial<Record<ColorRole, number>> = {
  heading: 0,
  body: 0,
  date: 0,
  button: 0,
  background: 1,
  subheading: 2,
  icon: 2,
  link: 2,
  divider: 3,
}

export const CURATED_PALETTES: CuratedPalette[] = [
  {
    id: 'sage-cream',
    name: 'Sage & Cream',
    swatches: ['#3f4a3c', '#f5f2ea', '#9caf88', '#c5d1b9', '#7a8a6e'],
    roleAssignments: STD,
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    swatches: ['#41302a', '#faf4ee', '#c87f5a', '#e3b89f', '#a05f3e'],
    roleAssignments: STD,
  },
  {
    id: 'dusty-rose',
    name: 'Dusty Rose',
    swatches: ['#4a3b3b', '#fbf6f3', '#dcae96', '#ecd2c3', '#b98a72'],
    roleAssignments: STD,
  },
  {
    id: 'burgundy-gold',
    name: 'Burgundy & Gold',
    swatches: ['#6e1f2c', '#f8f3ec', '#c9a96e', '#e0cba4', '#8c3a47'],
    roleAssignments: STD,
  },
  {
    id: 'navy-champagne',
    name: 'Navy & Champagne',
    swatches: ['#1f3a5f', '#f7f1e3', '#c9a96e', '#dfd0b2', '#3c5478'],
    roleAssignments: STD,
  },
  {
    id: 'olive',
    name: 'Olive',
    swatches: ['#3a4222', '#f7f5ec', '#6b7a3a', '#aab877', '#8c9a55'],
    roleAssignments: STD,
  },
  {
    id: 'lavender',
    name: 'Lavender',
    swatches: ['#463d52', '#f9f6fc', '#b8a5cc', '#d9cce6', '#937daf'],
    roleAssignments: STD,
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    swatches: ['#18181b', '#ffffff', '#52525b', '#d4d4d8', '#a1a1aa'],
    roleAssignments: STD,
  },
  {
    id: 'slate-blush',
    name: 'Slate & Blush',
    swatches: ['#334155', '#fdf8f6', '#c98e8e', '#e6cfcf', '#64748b'],
    roleAssignments: STD,
  },
  {
    id: 'forest-linen',
    name: 'Forest & Linen',
    swatches: ['#1f3326', '#f6f3ec', '#4f7259', '#b9c7ae', '#86755b'],
    roleAssignments: STD,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    swatches: ['#ece7df', '#171a21', '#c9a96e', '#56607a', '#9aa3ba'],
    roleAssignments: STD,
  },
  {
    id: 'charcoal-coral',
    name: 'Charcoal & Coral',
    swatches: ['#2a2a2a', '#fafafa', '#e07a5f', '#f2c4b3', '#6b6b6b'],
    roleAssignments: STD,
  },
]

export function paletteFromCurated(p: CuratedPalette): PaletteSettings {
  return {
    presetId: p.id,
    swatches: [...p.swatches],
    roleAssignments: { ...p.roleAssignments },
  }
}

export const COLOR_ROLE_LABELS: Record<ColorRole, string> = {
  background: 'Fondo de sección',
  heading: 'Títulos',
  subheading: 'Subtítulos',
  body: 'Texto',
  date: 'Fechas',
  icon: 'Iconos',
  button: 'Botones',
  link: 'Links',
  divider: 'Divisores',
}
