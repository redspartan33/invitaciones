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

9. **Map** — Mapa interactivo embebido de Google Maps a partir de una dirección, con link "Abrir en Google Maps"

Los bloques de invitación con iconos (Event details, Timeline) tienen un toggle "Ocultar iconos del bloque" en su panel de estilos.

### RSVP — WhatsApp o formulario con guestlist

El bloque RSVP tiene dos modos, elegibles desde el panel de configuración:

- **WhatsApp (default)** — Botón que abre `https://wa.me/<phone>?text=<mensaje URL-encoded>` si defines un teléfono internacional (solo dígitos). Cae a `rsvpLink` clásico si no hay teléfono.
- **Formulario de confirmación** — Toggle "Usar formulario en vez de WhatsApp". Al activarlo se genera automáticamente un link público único (`/?guestlist=<slug>`) atado a la invitación y se inicializa el archivo en Vercel Blob. El botón "Confirmar asistencia" abre un formulario inline pidiendo nombre + mensaje opcional. Al enviar (éxito o error) el formulario se cierra y se muestra el feedback correspondiente.

**Una confirmación por dispositivo** — Tras enviar, se guarda un marcador en `localStorage` (`guestlist-submitted:<slug>` con `{ name, ts }`). En la vista pública (sin `?admin=`), si el marcador existe el botón y el formulario se ocultan permanentemente y solo se muestra el mensaje "¡Gracias, <nombre>! Tu confirmación quedó registrada. Solo se permite una confirmación por dispositivo." Este lock solo se aplica en público; en el editor (`?admin=...`) el flujo sigue disponible para previsualización del diseñador.

**Link de invitados (`/?guestlist=<slug>`)** — Página pública compartible con el cliente que muestra: contador grande de confirmados, contador adicional de resultados al buscar, buscador por nombre/mensaje, lista con timestamps y botón "Actualizar" para refrescar. Se auto-refresca por evento `storage` cuando otra pestaña confirma y al volver a tener foco.

**Fallback de desarrollo** — `src/utils/guestlistClient.ts` intenta la API serverless (`/api/guestlists/<slug>`) primero y, si no está disponible (ej. `vite dev`), persiste las confirmaciones en `localStorage` con clave `guestlist:<slug>`. Al cargar la lista, mergea entradas remotas + locales (las remotas ganan por id). En producción la fuente de verdad es Vercel Blob; el cliente envía siempre al servidor y solo cae a local si la red falla. Así el editor en local funciona end-to-end sin necesitar `vercel dev`.

### Favicon y Google Fonts (Detalles / Fuentes)

- **Favicon**: en el panel **Detalles** puedes pegar una URL o subir un PNG/SVG/ICO. Se aplica como `<link rel="icon">` en la vista pública y en el editor.
- **Google Fonts**: en **Fuentes** puedes escribir el nombre exacto de cualquier fuente de Google (con autocompletado de 15 sugerencias). Se carga vía `<link>` a `fonts.googleapis.com/css2`. La fuente de "Títulos" se aplica a h1/h2/h3 y la de "Cuerpo" al resto. Cuando defines fuentes custom mandan sobre la elección Serif/Sans/Script.

### Bloques de menú (kind = `menu`)

- **Menu header** — Portada del restaurante + barra sticky de navegación que se enlaza con cada sección. Tamaño de barra (S/M/XL) y tamaño de logo (S/M/L/XL) configurables.
- **Menu section** — Lista de platillos con título, descripción opcional y espaciado entre platillos configurable (XS/SM/MD/LG/XL)
- **Menu note** — Texto suelto (alérgenos, propina, etc.)
- **Menu footer** — Dirección, horarios, redes

La barra sticky del menú hace deep-link a cada sección vía hash; los clicks se manejan con `scrollIntoView` para evitar problemas de layout shift cuando la barra se vuelve fija. En la vista pública, la barra incluye **scrollspy**: la sección visible al hacer scroll se marca como activa y la barra se auto-desplaza horizontalmente para mantenerla a la vista.

## Editor en móvil

En pantallas `< 768px` el `ConfigPanel` queda oculto por defecto y el `Canvas` ocupa todo el ancho. Al tocar un bloque (o un panel del Footbar — Detalles, Colores, Fuentes, Música) el panel aparece **a pantalla completa** con su propio botón **×** en el header y un botón **Listo** al pie. Cerrar regresa al editor con la selección limpiada.

El header del editor también colapsa en móvil: oculta etiquetas redundantes (Volver, Reiniciar, Despublicar, "Guardar cambios" → "Guardar") y deja sólo iconos para Compartir. El popover de compartir ocupa el ancho casi completo en móvil en vez de 420px fijos.

## Importar platillos desde texto plano

En el panel de un bloque **Menu section** hay un botón **Pegar texto** que abre un área para pegar platillos en cualquier formato común. El parser autodetecta:

- Bloques separados por línea vacía (`Nombre / Descripción / $Precio` cada uno)
- Una línea por platillo con separadores (`—`, `|`, `·`, ` - `)
- Precios al final, inline (`Nombre $133`) o como columna independiente
- Monedas opcionales: `$`, `MXN`, `USD`, `EUR`, `pesos`

Muestra un contador en vivo de platillos detectados y permite **Añadir** (append) o **Reemplazar** los actuales.

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

## Backend en Vercel (Vercel Blob)

El backend vive en este mismo repo como funciones serverless de Vercel y guarda
cada invitación como un blob público JSON en `inv/<slug>.json`. No requiere
subdominio: comparte el dominio del frontend.

**Endpoints (mismo origen):**

```
GET    /api/health                       → { ok: true }
GET    /api/diag                         → estado vivo del Blob store
PUT    /api/invitations/<slug>           → { ok: true }    (body: Invitation JSON)
GET    /api/invitations/<slug>           → Invitation JSON | 404
DELETE /api/invitations/<slug>           → { ok: true }
GET    /api/invitations/index            → [Invitation, …]   (todas)
DELETE /api/invitations/index?id=<slug>  → { ok: true }
```

### Setup en Vercel (una sola vez)

1. En el dashboard de Vercel del proyecto, ve a **Storage → Create Database →
   Blob → Connect to Project** (elige Production + Preview + Development).
2. Vercel inyecta automáticamente `BLOB_READ_WRITE_TOKEN`. No hay que copiar
   nada manualmente.
3. El redeploy automático deja los endpoints listos. Verifica con
   `/api/diag` que `writeOk` y `readOk` sean `true`.

### Garantía de publicación

`publishInvitation` es atómico: marca la invitación como `published` **solo**
si el servidor aceptó el `PUT`. Si falla, el popover de Compartir muestra el
error y la invitación se queda en `draft`. Nunca generamos links rotos.
