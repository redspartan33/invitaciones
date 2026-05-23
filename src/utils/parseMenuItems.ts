import { v4 as uuid } from 'uuid'
import type { MenuItem } from '../types/invitation.types'

// Matches a standalone price token: "$133", "133", "$1,250.50", "133 MXN", "133 pesos"
const PRICE_TOKEN = /^\$?\s*[\d][\d.,]*\s*(?:MXN|USD|EUR|pesos)?$/i
// Matches a price embedded at end of a line (with surrounding space)
const PRICE_AT_END = /\s+(\$\s*[\d][\d.,]*(?:\s*(?:MXN|USD|EUR|pesos))?|[\d][\d.,]*\s*(?:MXN|USD|EUR|pesos))\s*$/i
// Common in-line separator between fields ("—", "|", " - ", " · ")
const FIELD_SEP = /\s*[—|·]\s*|\s+-\s+/

function isPriceLine(line: string): boolean {
  return PRICE_TOKEN.test(line.trim())
}

function extractTrailingPrice(s: string): { rest: string; price: string } {
  const m = s.match(PRICE_AT_END)
  if (!m) return { rest: s, price: '' }
  return { rest: s.slice(0, m.index).trim(), price: m[1].trim() }
}

/**
 * Parse free-form text pasted by the user into MenuItem records.
 *
 * Supported shapes (autodetected):
 *
 *   1. Blank-line groups, 1-3 lines each:
 *        Lorraine
 *        Con tocino / with bacon.
 *        $133
 *
 *   2. One item per line, optional inline price at end:
 *        Lorraine — Con tocino — $133
 *        Homero $133
 *
 *   3. Separator-delimited columns ("—", "|", "·", " - "):
 *        Lorraine | Con tocino | $133
 *
 * Items with empty names are dropped.
 */
export function parseMenuItems(text: string): MenuItem[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const hasBlankLines = /\n\s*\n/.test(trimmed)
  const blocks = hasBlankLines
    ? trimmed.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean)
    : trimmed.split(/\n+/).map((b) => b.trim()).filter(Boolean)

  const items: MenuItem[] = []
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue

    let name = ''
    let description = ''
    let price = ''

    // Multi-line block: name on line 1, description on middle, price on last
    if (lines.length > 1) {
      if (isPriceLine(lines[lines.length - 1])) {
        price = lines.pop()!.replace(/\s+/g, ' ')
      }
      name = lines[0]
      description = lines.slice(1).join(' ')
    } else {
      // Single line — try separator split, then inline price at end
      const single = lines[0]
      const parts = single.split(FIELD_SEP).map((p) => p.trim()).filter(Boolean)
      if (parts.length >= 2) {
        name = parts[0]
        // Last column is price if it looks like one
        if (isPriceLine(parts[parts.length - 1])) {
          price = parts.pop()!
        }
        description = parts.slice(1).join(' — ')
      } else {
        name = single
      }
    }

    // Pull a trailing price out of the name (e.g. "Lorraine $133")
    if (!price && name) {
      const ex = extractTrailingPrice(name)
      if (ex.price) {
        name = ex.rest
        price = ex.price
      }
    }
    // Or out of the description
    if (!price && description) {
      const ex = extractTrailingPrice(description)
      if (ex.price) {
        description = ex.rest
        price = ex.price
      }
    }

    if (!name) continue
    items.push({
      id: uuid(),
      name,
      ...(description ? { description } : {}),
      ...(price ? { price } : {}),
    })
  }
  return items
}
