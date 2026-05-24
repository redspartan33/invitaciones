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

9. **Map** — Mapa interactivo embebido a partir de una dirección de texto.

10. **Image set** — Bloque de 1 a 3 imágenes en una sola fila. La regla de columnas es fija tanto en mobile como en desktop: 1 imagen → centrada en columna única, 2 imágenes → dos columnas, 3 imágenes → tres columnas. Cada cell tiene proporción configurable (cuadrada/vertical/horizontal/original) y pie de foto opcional. El botón "Añadir imagen" se deshabilita al llegar al máximo de 3.

Usamos directamente el iframe clásico de Google Maps (`https://www.google.com/maps?q=<address>&output=embed`) que no requiere API key ni geocoding cliente, así que funciona en redes que bloquean Nominatim. Si pegas tu propio `embedUrl` se usa en su lugar. Bajo el mapa hay un botón prominente "Abrir en Google Maps" como alternativa para abrir nativo.

### Animaciones de entrada por bloque

Cada bloque expone un **selector "Animación de entrada"** en su panel (justo después de los items repetibles y antes de la separación interna). Las animaciones usan [framer-motion](https://www.framer.com/motion/) con `whileInView` para dispararse cuando el bloque entra al viewport del invitado, tanto en el canvas del editor como en la vista pública.

El catálogo tiene **42 efectos** agrupados con `<optgroup>`:

- **Fundido** (7): fade básico + 4 direcciones + variantes grandes
- **Deslizar** (4): up/down/left/right sin fade
- **Zoom** (6): in/out + combinados con dirección
- **Blur** (3): blur-in, blur+sube, blur+zoom cinemático
- **Flip 3D** (4): rotaciones perspectivadas
- **Rotación** (7): sutil, 4 esquinas, swing y roll-in
- **Spring / Rebote** (5): bounce, elastic, jelly (squash & stretch)
- **Cinemático / Especial** (6): cortina con clip-path en 4 direcciones, skew, profundidad 3D

Cada animación define su propia transición (curva o spring). El selector también muestra un botón **"↻ Volver a reproducir"** que retriggerea la animación al instante para previsualizar. Se guarda en `block.style.entryAnimation`. El wrapper `AnimatedBlock` envuelve cada bloque desde `BlockRenderer`, así que aplica uniformemente a todos los tipos (invitación y menú).

Los bloques de invitación con iconos (Event details, Timeline) tienen un toggle "Ocultar iconos del bloque" en su panel de estilos.

### Fecha y hora del bloque Event details

En el panel del bloque **Event details**, sección "Visibilidad y formato", hay tres controles:

- **Mostrar fecha** / **Mostrar hora** — toggles independientes para ocultar o mostrar cada línea sin necesidad de borrar los valores.
- **Formato de hora** — selector entre **24 horas** (`18:00`) y **12 horas** (`6:00 PM`). El valor se guarda como `HH:mm` (input nativo `type="time"`) y se formatea al render según el modo elegido. Los toggles por defecto vienen en `true`; data legacy (sin estos campos) se sigue mostrando como antes y el toggle se renderiza en su estado efectivo.

### Fondo por bloque (color, imagen, posición y ajuste)

Cada bloque tiene una sección **"Fondo del bloque"** al final de su panel:

- **Color de fondo** — picker nativo + input hex, con botón × para limpiar.
- **Imagen de fondo** — URL o subida de archivo (3 MB max). Cuando hay imagen aparecen dos controles extra:
  - **Ajuste**: `cover` (rellena todo, puede recortar), `contain` (cabe completa), `auto` (tamaño original).
  - **Posición**: grid de 9 direcciones (↖ ↑ ↗ ← • → ↙ ↓ ↘) para anclar la imagen.

Se guardan en `block.style.backgroundColor / backgroundImage / backgroundSize / backgroundPosition` y se aplican en `BlockWrapper`, así que se ven igual en canvas y link publicado.

### Separación entre elementos internos

Todos los bloques tienen un control **"Separación entre elementos internos"** (xs/sm/md/lg/xl) que define el gap vertical entre items de un mismo bloque (actividades del Timeline, fotos de la galería, regalos del registry, platillos del menú, etc.). Se persiste en `block.style.itemSpacing` y se expone como variable CSS `--item-gap` desde `BlockWrapper`.

### Bold / Italic por texto

Cada campo de texto editable muestra controles inline `B` / `I` junto al picker de tamaño/color para aplicar negrita o cursiva solo a ese elemento. Se persisten en `block.style.textStyles[field].bold/italic` y se aplican en `TextEl`.

### Reordenar elementos desde el sidebar

Las listas dentro de los bloques (timeline, galería, registry, menú) se reordenan con drag-and-drop desde el sidebar — el handle `⋮⋮` aparece a la izquierda de cada item. El orden del formulario es exactamente el que se ve en preview y en el link publicado. Los whole-blocks siguen reordenándose en el canvas.

### Publish con imágenes pesadas

Antes, subir varias imágenes vía FileReader generaba un JSON de invitación con `data:image/...;base64,...` embebidos que excedía el límite de body de Vercel (4.5 MB) y el publish fallaba en silencio — el síntoma reportado era "no se publica" y "no respeta las tipografías" (porque el publish no completó y nada se persistió).

Al publicar, `extractAndUploadAssets` (en `src/utils/publishAssets.ts`) recorre toda la invitación, encuentra cada `data:` URI en campos de imagen conocidos (`backgroundImage`, `logo`, `image`, `inspirationImage`, `url` de galería, `favicon`), los sube al blob público vía `/api/assets` y reemplaza por URLs en el JSON. El payload final queda muy por debajo del límite. Si la subida falla se muestra un error claro y el publish no marca la invitación como publicada.

### Sidebar y viewport realista

El sidebar derecho mantiene **ancho fijo de 380px** en desktop. El canvas central centra la invitación / menú y los tabs `Mobile / Tablet / Desktop` cambian a un preview a escala de dispositivo: marco redondeado tipo iPhone (390×760) para mobile, tipo tablet (820×1080) para tablet, y caja sin marco hasta 1100px para desktop.

### RSVP — WhatsApp o formulario con guestlist

El bloque RSVP tiene dos modos, elegibles desde el panel de configuración:

- **WhatsApp (default)** — Botón que abre `https://wa.me/<phone>?text=<mensaje URL-encoded>` si defines un teléfono internacional (solo dígitos). Cae a `rsvpLink` clásico si no hay teléfono.
- **Formulario de confirmación** — Toggle "Usar formulario en vez de WhatsApp". Al activarlo se genera automáticamente un link público único (`/?guestlist=<slug>`) atado a la invitación y se inicializa el archivo en Vercel Blob. El botón "Confirmar asistencia" abre un formulario inline pidiendo nombre + mensaje opcional. Al enviar (éxito o error) el formulario se cierra y se muestra el feedback correspondiente.

**Una confirmación por dispositivo** — Tras enviar, se guarda un marcador en `localStorage` (`guestlist-submitted:<slug>` con `{ name, ts }`). En la vista pública (sin `?admin=`), si el marcador existe el botón y el formulario se ocultan permanentemente y solo se muestra el mensaje "¡Gracias, <nombre>! Tu confirmación quedó registrada. Solo se permite una confirmación por dispositivo." Este lock solo se aplica en público; en el editor (`?admin=...`) el flujo sigue disponible para previsualización del diseñador.

**Link de invitados (`/?guestlist=<slug>`)** — Página pública compartible con el cliente que muestra: contador grande de confirmados, contador adicional de resultados al buscar, buscador por nombre/mensaje, lista con timestamps y botón "Actualizar" para refrescar. Se auto-refresca por evento `storage` cuando otra pestaña confirma y al volver a tener foco.

**Fuente única de verdad: el servidor (Vercel Blob)** — `src/utils/guestlistClient.ts` ya **no** persiste entradas en `localStorage`. Las confirmaciones se leen y se escriben siempre vía `/api/guestlists/<slug>`, y si el servidor falla se muestra un mensaje de error con botón "Reintentar" en lugar de guardar en local. Esto garantiza que dos dispositivos abriendo el mismo link vean exactamente la misma lista. Lo único que se sigue guardando en local es el marcador `guestlist-submitted:<slug>` para evitar que el mismo navegador confirme dos veces.

**Lecturas frescas** — el endpoint GET usa `list({ prefix })` + `fetch(url, { cache: 'no-store' })` en vez de `get()`, evitando la caché del CDN de Vercel Blob después de un `put(allowOverwrite)`. Sin esto un dispositivo podía ver una lista cacheada mientras otro escribía una nueva entrada.

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

**Paridad de features mobile/desktop:** todas las features del editor están disponibles en ambos viewports (no hay funcionalidad oculta solo en desktop). El `AdminView` colapsa header y items a columna en `< 768px`. El `BlockWrapper` usa padding responsivo (`py-12/md:py-20`, `px-5/md:px-8`) para que el contenido respire en pantallas pequeñas sin desperdiciar espacio en grande. La vista pública de invitaciones y menús se renderiza idéntica en móvil y desktop, con sticky nav, scrollspy y mapa funcionando en ambas.

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
