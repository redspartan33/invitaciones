// Token "encriptado" — sólo tú y yo lo sabemos.
// Cualquier ruta sin este token o sin un ?inv=<id> válido devuelve 403.
export const ADMIN_TOKEN = 'jb-c7f9a3e1b8d24f5e9a1c6b3d8e2f4a7b'

export function isAdminUrl(url: URL): boolean {
  return url.searchParams.get('admin') === ADMIN_TOKEN
}
