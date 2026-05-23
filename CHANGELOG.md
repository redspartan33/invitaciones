# Changelog

## v1 — Menus & Invitaciones estable (2026-05-23)

Branch: `stable/menus-invitaciones-v1` · Tag: `menus-invitaciones-v1`

Primer release estable con soporte completo para invitaciones digitales y menús de restaurante.

### Invitaciones (`kind = invitation`)

- 8 bloques: Hero, Event details, Timeline, Dress code, Gift registry, RSVP info, Gallery, Footer
- Panel de colores (3 colores + paletas), fuentes (serif / sans / script), música (MP3 con player flotante)
- Viewport switcher móvil / tablet / escritorio
- Auto-save debounced a `localStorage` por invitación
- Publicación atómica vía Vercel Blob → link corto `?id=<slug>` (slug base62 de 9 chars)
- Link portable vía `#data=<base64>` (datos comprimidos en la URL, no requiere backend)

### Menús (`kind = menu`)

- 4 bloques: Menu header, Menu section, Menu note, Menu footer
- Barra sticky de navegación con dos modos: `stickyHeader` (todo el header fijo) o `stickyNavOnly` (solo la barra al hacer scroll)
- Hash deep-link a cada sección (`?id=…#sección`) — el click usa `scrollIntoView` para evitar layout shift cuando la barra se vuelve fija
- `itemSpacing` configurable (XS/SM/MD/LG/XL) por sección
- Template ejemplo Marullier con 14 secciones precargadas

### Admin

- `?admin=<token>` para gestionar múltiples invitaciones independientes
- Lista borradores y publicadas, copiar link corto, eliminar de forma segura
- Banner de diagnóstico (`/api/diag`) cuando el Blob Store no está conectado

### Backend (Vercel Blob)

- Funciones serverless en `/api` (mismo origen del frontend)
- Endpoints `PUT/GET/DELETE /api/invitations/<slug>` + índice global
- `publishInvitation` atómico: solo marca como `published` si el `PUT` fue aceptado
