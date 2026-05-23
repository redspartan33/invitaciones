# Digital Invitation Builder

Editor visual estilo Invitio para crear invitaciones digitales profesionales
(bodas, cumpleaños, eventos corporativos, etc.) con vista dividida
**Canvas + ConfigPanel**, bloques modulares y preview en tiempo real.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** (UI plana, sin sombras)
- **Zustand** para estado global
- **@dnd-kit** para reordenar bloques con drag & drop
- **localStorage** para auto-save del borrador

## Estructura

```
src/
├─ components/
│  ├─ editor/         InvitationBuilder, EditorHeader, Canvas, ConfigPanel, Footbar
│  ├─ blocks/         8 bloques renderizables (Hero, EventDetails, Timeline…)
│  └─ forms/          DynamicBlockForm + sub-forms (Timeline, GiftRegistry, Gallery)
├─ hooks/             useInvitationEditor, useSelectedBlock, useBlockForm, useAutoSave
├─ store/             editorStore (Zustand)
├─ types/             invitation.types.ts
└─ utils/             blockDefaults, blockValidation
```

## Tipos de bloques

1. **Hero** — Portada (título, subtítulo, fecha, fondo)
2. **Event details** — Cuándo y dónde
3. **Timeline** — Itinerario con iconos por actividad
4. **Dress code** — Código de vestimenta + inspiración
5. **Gift registry** — Mesa de regalos (links a tiendas)
6. **RSVP info** — Instrucciones, fecha límite, contacto
7. **Gallery** — Galería de fotos responsive
8. **Footer** — Mensaje final + contacto + redes

## Funcionalidades

- Click en cualquier bloque → abre su formulario a la derecha
- Cambios en el formulario actualizan el canvas en vivo
- + Añadir bloque, duplicar, ocultar/mostrar, eliminar
- Drag & drop para reordenar
- Panel global de **colores** (3 colores + paletas sugeridas) — los colores se aplican **solo al lienzo de la invitación**, nunca a la UI del editor
- **Publicar** la invitación → genera un link privado (mismo navegador) y un link portable (toda la invitación viaja codificada en el hash, abre en cualquier dispositivo)
- Panel global de **fuentes** (serif / sans / script)
- Panel global de **música** — reproduce un MP3 real (presets de SoundHelix o URL custom) con botón flotante de play/pausa en la vista pública
- Viewport switcher: móvil / tablet / escritorio

## Rutas y acceso

Esta app no tiene login. Las únicas rutas válidas son:

- `/?admin=jb-c7f9a3e1b8d24f5e9a1c6b3d8e2f4a7b` → **Panel admin** privado. Permite gestionar múltiples (N) invitaciones de manera aislada. Lista todas las invitaciones creadas (borradores y publicadas), permite editarlas sin interferencias, copiar su link corto único de compartir o eliminarlas físicamente de forma segura.
- `/?inv=<slug>` → **Link corto y único** de vista pública para una invitación publicada (por ejemplo: `http://localhost:5173/?inv=sD7aK2fG9`). El `<slug>` es un identificador aleatorio base62 corto de solo 9 caracteres, lo que lo hace muy corto, fácil de compartir y sumamente seguro (alta entropía criptográfica, no enumerable para proteger la privacidad de tus invitados).
- `/#data=<base64>` → Vista pública portable (los datos de la invitación viajan comprimidos y codificados en la URL, abriendo en cualquier dispositivo sin necesidad de backend).
- **Cualquier otra ruta** (incluyendo `/`, links borrados o IDs inválidos) → **403 Acceso denegado**.

El token admin está hardcodeado en `src/admin/adminAuth.ts`. Cámbialo antes de hacer deploy a producción.
- Soporte para múltiples (N) invitaciones simultáneas e independientes en local y backend
- Guardado y actualización directa ("Guardar cambios") de invitaciones publicadas sin alterar sus enlaces
- Auto-save debounced a `localStorage` por invitación específica
- Copiado rápido de link corto único en el panel de administrador
- Modal de guía con instrucciones

## Desarrollo

```bash
npm install
npm run dev
```

App: http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Deploy a Hostinger (u otro hosting estático)

**Importante:** no se puede subir el código fuente directamente — el navegador no
ejecuta TypeScript ni resuelve imports como `import React from 'react'`. Hay que
compilarlo con Vite primero:

```bash
npm run build
```

Esto genera la carpeta `dist/`. Sube **todo el contenido de `dist/`** (no la carpeta,
su contenido) al `public_html` de Hostinger via File Manager, FTP o SFTP.

`public/.htaccess` se copia automáticamente al build y hace dos cosas:

- SPA fallback: cualquier ruta cae en `index.html` para que `/?inv=<id>` funcione
- Cache largo para los assets hasheados, `no-cache` para el HTML

## Backend en Vercel (Vercel KV / Upstash Redis)

El backend vive en este mismo repo como funciones serverless de Vercel y guarda
cada invitación como un valor JSON en **Vercel KV** (Upstash Redis), bajo la
clave `inv:<slug>`. No requiere subdominio: comparte el dominio del frontend.

**Endpoints (mismo origen):**

```
GET    /api/health                       → { ok: true }
PUT    /api/invitations/<slug>           → { ok: true }    (body: Invitation JSON)
GET    /api/invitations/<slug>           → Invitation JSON | 404
DELETE /api/invitations/<slug>           → { ok: true }
GET    /api/invitations/index            → [Invitation, …]   (todas)
DELETE /api/invitations/index?id=<slug>  → { ok: true }
```

### Setup en Vercel (una sola vez)

1. En el dashboard de Vercel del proyecto, ve a **Storage → Create Database →
   Marketplace Database Providers → Upstash for Redis** (o **KV**) →
   **Connect to Project** (elige Production + Preview + Development).
2. Vercel inyecta automáticamente las variables `KV_URL`, `KV_REST_API_URL`,
   `KV_REST_API_TOKEN` y `KV_REST_API_READ_ONLY_TOKEN`. No hay que copiar nada.
3. Redeploy: los endpoints `/api/invitations/*` ya escriben y leen de KV.

### Migrar invitaciones existentes desde Vercel Blob

Si antes estabas en el backend de Blob, hay un endpoint one-shot que copia
todos los blobs `inv/*.json` a KV. Es idempotente (puedes correrlo varias
veces; sobreescribe con el contenido más reciente del blob, no borra blobs):

```
GET /api/migrate-from-blob?admin=<ADMIN_TOKEN>
```

Donde `<ADMIN_TOKEN>` es el mismo de `src/admin/adminAuth.ts`. Devuelve un
JSON con `{ total, migrated, failed }`. Después del primer corrido puedes
desconectar el Blob Store de Vercel si quieres.

### Sin backend (fallback)

Si la conexión a KV falla en el momento de publicar, `publishInvitation`
marca `publishMode: 'error'` y muestra el error en el ConfigPanel — el link
publicado **no** se considera válido en ese caso. Los borradores siguen en
`localStorage` para no perder trabajo.
