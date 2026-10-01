# Changelog

## Pases personalizados (2026-10-01)

- Botón **"+ Crear pase personalizado"** en la página de invitados y en el editor (bloque RSVP → Guestlist público): nombre, número de invitados y mensaje opcional.
- Link único `?inv=<slug>&pase=<lista>.<id>` que replica la invitación tal cual; el botón de confirmación abre el mismo modal de siempre, con nombre y lugares fijos, mensaje opcional y botón Confirmar.
- La lista de invitados marca las confirmaciones por pase, suma "Lugares por pase" y muestra el estado de cada pase. Funciona con el backend actual (sin cambios en `invitaciones-api`).

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
