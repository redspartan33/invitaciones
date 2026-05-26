// Centralizes how every `/api/*` fetch is composed.
//
// In production the backend lives on a separate subdomain (api.lamartinasma.com)
// so we have to prepend the absolute origin. In dev the Vite server serves
// the frontend and we expect a `/api` proxy (or the same-origin Node server
// during `vite preview`) so we keep paths relative.
const PROD_API_ORIGIN = 'https://api.lamartinasma.com'

export const API_BASE: string = import.meta.env.PROD ? PROD_API_ORIGIN : ''

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

// Asset URLs persisted in invitation JSON look like `/api/asset/<folder>/<file>`.
// In dev they resolve same-origin; in prod we have to point them at the API
// origin so <img src> actually loads the bytes.
export function resolveAssetUrl(src: string | undefined | null): string {
  if (!src) return ''
  if (src.startsWith('/api/')) return `${API_BASE}${src}`
  return src
}
