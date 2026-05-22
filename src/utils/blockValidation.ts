import type { BlockType, InvitationBlock } from '../types/invitation.types'

export type ValidationResult = {
  valid: boolean
  errors: Record<string, string>
}

// Todos los campos son opcionales — si están vacíos simplemente no se renderizan.
const REQUIRED: Partial<Record<BlockType, string[]>> = {}

export function validateBlock(block: InvitationBlock): ValidationResult {
  const errors: Record<string, string> = {}
  const required = REQUIRED[block.type] ?? []
  for (const field of required) {
    const value = (block.data as unknown as Record<string, unknown>)[field]
    if (value == null || (typeof value === 'string' && !value.trim())) {
      errors[field] = 'Este campo es obligatorio'
    }
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export function formatDate(value: string, format: string): string {
  if (!value) return ''
  // Si viene en formato YYYY-MM-DD (input type="date") lo parseamos como
  // fecha local para evitar el offset UTC que muestra el día anterior.
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const d = ymd ? new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])) : new Date(value)
  if (isNaN(d.getTime())) return value
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'MMMM DD, YYYY':
      return `${months[d.getMonth()][0].toUpperCase()}${months[d.getMonth()].slice(1)} ${day}, ${year}`
    case 'DD MMMM YYYY':
      return `${day} de ${months[d.getMonth()]} de ${year}`
    default:
      return `${day}/${month}/${year}`
  }
}
