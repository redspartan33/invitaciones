/**
 * Resolve the rendered order of a block's visible text fields.
 *
 * `defaults` is the block's natural order (hardcoded in each block's component).
 * `custom` is the per-block override stored in `block.style.fieldOrder`.
 *
 * We preserve any field in `custom` that exists in `defaults`, then append any
 * defaults the user hasn't touched yet (so newly-added fields show up at the
 * end without resetting the user's existing arrangement).
 */
export function resolveFieldOrder(defaults: string[], custom?: string[]): string[] {
  if (!custom || custom.length === 0) return defaults
  const allowed = new Set(defaults)
  const kept = custom.filter((k) => allowed.has(k))
  const seen = new Set(kept)
  const appended = defaults.filter((k) => !seen.has(k))
  return [...kept, ...appended]
}
