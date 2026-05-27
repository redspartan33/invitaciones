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

### ID personalizado por sección

Cada **Menu section** expone un campo opcional **"ID personalizado"** (`customAnchor`) en su panel. Cuando se define, el anchor en el DOM (`#tu-id`) y el target al que apuntan los items de la nav personalizada usan ese slug en vez del auto-derivado del título. La utilidad `slugifyAnchor` en [src/utils/menuNav.ts](src/utils/menuNav.ts) saneа el input (lowercase, ASCII, guiones). Útil para mantener la URL estable al renombrar el título o para que un item custom de la nav apunte por nombre estable.

### Navegación del menú personalizable

El bloque **Menu header** expone un editor **"Navegación"** ([MenuNavItemsForm](src/components/forms/MenuNavItemsForm.tsx)):

- Por defecto la nav se genera automáticamente con todas las secciones visibles.
- Al pulsar **Personalizar**, el editor crea una lista editable seedeada con las secciones actuales: puedes renombrar cada item, reordenar con drag&drop, eliminarlo y añadir items custom.
- Cada item custom apunta a una sección elegida de un **dropdown de secciones disponibles** (se muestra el título + `#anchor` + badge `ID propio` cuando aplica).
- Si una sección referenciada desaparece, el item se marca con una advertencia y un warning chip "⚠ #anchor (sección no encontrada)".
- **Restaurar auto** vuelve al modo automático.

El override se guarda en `menuHeaderData.navItems`. Los labels custom se incluyen en el whitelist de traducción (`menu-header` → `navItems[].label`) así que también cambian al elegir EN/FR en el header.

### Plantilla por defecto

Al crear un menú nuevo desde el admin el editor abre con un esqueleto mínimo (header + 1 sección con 2 platillos + footer vacío) — sin nombres de marca ni contenido de demo. La intención es que el usuario llene su propio menú desde una base limpia.

### Traducción del menú (ES / EN / FR)

En el panel **Detalles** del editor de menú se puede activar un bloque **"Traducción"** con toggles para `English` y `Français` (el `Español` siempre está activo como idioma original). Cuando hay 2+ idiomas activados:

- Al pulsar **Publicar** todos los textos visibles del menú (titles, descriptions, names, notes, footer, etc.) se traducen automáticamente vía la API gratuita de [MyMemory](https://mymemory.translated.net/) y quedan guardados en `invitation.translations` (un mapa `{ blockId: { lang: { fieldPath: 'translated' } } }`).
- En la vista pública el `MenuHeaderBlock` muestra las pastillas con los idiomas activados. El visitante elige y todo el bloque renderiza con los strings traducidos — incluyendo los títulos de la barra sticky de navegación.
- Si la traducción falla (rate-limit, sin red, etc.) el publish no se bloquea: el menú se publica igual y los botones de idioma simplemente no aparecen hasta que se vuelva a publicar.

El whitelist de campos traducibles vive en [`src/utils/translation.ts`](src/utils/translation.ts) (`TRANSLATABLE`), por tipo de bloque — para evitar traducir URLs, hex de colores, fechas o iconos.

### Menús por temporada (variantes)

En el panel **Detalles** del editor de menú se puede activar la sección **"Temporadas"** para tener varias versiones del mismo menú (verano, invierno, brunch, navidad…). El modelo extiende `Invitation` con dos campos opcionales:

```ts
menuVariants?: { id, label, blocks }[]
activeVariantId?: string   // la que ven los visitantes por defecto
editingVariantId?: string  // la que se está editando en el canvas
```

Cuando hay variantes, el campo `invitation.blocks` es un mirror del array de bloques de la variante en edición — el helper `mergeBlocks` en [src/store/editorStore.ts](src/store/editorStore.ts) sincroniza la variante activa cada vez que se toca un bloque, así que todos los renderers y forms existentes siguen funcionando sin cambios.

- **Switcher en el canvas** — arriba del lienzo aparece una barra con una pill por cada temporada. La pill marcada con ★ es la activa para el público; la pill negra es la que estás editando. Botón **+ Temporada** crea una nueva (con prompt para nombre + confirm para duplicar de la actual o empezar vacía).
- **Gestión en Detalles** — cada temporada se puede renombrar inline, marcar como activa con un radio, o eliminar (mínimo 1). Al apagar el toggle "Temporadas" se consolida a la variante activa y se borran las demás.
- **Selector público** — en `PublicInvitationView`, si hay 2+ variantes el menú renderiza unas tabs sticky justo antes del primer `menu-section`. Los visitantes pueden cambiar entre temporadas sin recargar; la variante activa es la que abre por defecto. Header y footer son independientes por variante (cada una mantiene su propio array de bloques completo).

### Fondo global de página (imagen o video)

En **Detalles** hay una sección **"Fondo de página"** que aplica un fondo a toda la vista pública detrás del contenido. El campo único es una URL pegada — la utilidad `detectBackgroundKind` ([src/utils/pageBackground.ts](src/utils/pageBackground.ts)) decide el tipo:

- **Imagen** (`.jpg/.png/.webp` u otra URL) → background-image con `fit` (cover/contain/tile/auto) y grid 3×3 de posiciones.
- **MP4/WebM/MOV** → `<video autoPlay muted loop playsInline>`.
- **YouTube** (cualquier formato — watch, youtu.be, shorts, embed) → `<iframe>` con `autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&playsinline=1` y `playlist=<id>` para que el loop funcione con un solo video.
- **Vimeo** → `<iframe>` con `?background=1&autoplay=1&muted=1&loop=1` (modo background nativo de Vimeo).

Los videos **siempre se reproducen silenciados** (requisito de autoplay en navegadores) y se escalan con `max(100vw, 177.78vh) × max(56.25vw, 100vh)` para cubrir el viewport independientemente de su aspecto 16:9.

Configuración adicional en el mismo row: **opacidad** (0–100%), **desenfoque** (0–30px aplicado al layer), **color encima** (overlay con color hex + alpha 0–100%), **comportamiento al scroll** (fijo tipo parallax o scrollea con el contenido). El render vive en [`PageBackgroundLayer`](src/components/public/PageBackgroundLayer.tsx) como dos capas `-z-20` (background) y `-z-10` (overlay) detrás del canvas.

Toggle **"Tarjeta central transparente"** vuelve el wrapper `max-w-[920px]` transparente para que el fondo se vea a través de los bloques (útil con un fondo de baja opacidad). Apagado mantiene la tarjeta sólida con el color secundario encima del fondo.

Toggle **"Ocultar fondos de bloques"** suprime el `backgroundColor` / `backgroundImage` que cada bloque tenga configurado, dejando ver libremente el fondo de página. Se propaga vía [`BlockBackgroundContext`](src/components/blocks/BlockBackgroundContext.tsx) que consumen `BlockWrapper`, `HeroBlock` y `MenuHeaderBlock`.

Ambos toggles funcionan igual para invitaciones y menús. Cuando se configura un `pageBackground`, los dos toggles **se asumen encendidos por default** (basta con setear `transparentCanvas` o `hideBlockBackgrounds` explícitamente a `false` para mantener el comportamiento legacy). En el editor cada device-frame agrega `isolation: isolate` para mantener el negative-z del background layer dentro del frame en lugar de detrás del lienzo gris.

En la vista pública, `PageBackgroundLayer` se monta a nivel de `App` (afuera de cualquier stacking context) con `position: fixed`. Como `fixed` se escapa de cualquier `isolation: isolate` en un wrapper, el negative-z del layer quedaba detrás del `background: #fafafa` que `index.css` aplica a `html/body/#root` y el fondo no se veía. La solución: mientras el layer está activo, su `useEffect` agrega la clase `has-page-background` al `<body>` y una regla CSS limpia el `background` de `html/body/#root` para esa visita.

### Métricas del menú (dashboard privado)

En **Detalles** (solo cuando `kind = menu`) hay una sección **"Métricas"** con un toggle. Al activarlo se genera un slug aleatorio independiente del `publicSlug` (`globalSettings.metricsSlug`) y se muestra una URL `?metrics=<slug>` para copiar o abrir. Botón "Regenerar enlace" produce un slug nuevo y revoca el anterior sin afectar el link público del menú.

El dashboard ([`MetricsView`](src/components/public/MetricsView.tsx)) consume `/api/metrics/:slug` — un endpoint que escanea `inv/` y devuelve la invitación cuyo `globalSettings.metricsSlug` coincide **y** tiene `enableMetrics = true`. Apagar el toggle desactiva el link sin borrar el slug, así que volver a encenderlo restaura el mismo URL.

El dashboard tiene **dos tabs**:

**Comportamiento (tab principal)** — derivado del log de visitas que el server guarda como JSONL en `views/<publicSlug>.jsonl`. Cada vez que un visitante abre el menú publicado, `PublicInvitationView` llama a [`recordView`](src/utils/viewTracking.ts) que envía un evento mínimo a `POST /api/views/:slug` con `{ viewerId, device, language, referrer, variantId }` — sin IP, sin UA fingerprinting, sin geo. El `viewerId` es un id aleatorio guardado en localStorage para distinguir visitantes únicos. El navegador no registra más de una visita por sesión (idempotencia vía `sessionStorage`). El dashboard pide los eventos con `GET /api/views/by-metrics/:metricsSlug` (auth implícita por el metricsSlug) y muestra:

- **Resumen de tráfico** — visitas totales, visitantes únicos, visitas/persona, últimos 7 y 30 días, última visita relativa.
- **Visitas por día (últimos 30)** — gráfico de barras verde.
- **Horario más activo** — histograma de 24 horas + indicador de hora pico y día de la semana con mayor actividad.
- **Dispositivos / Idioma / De dónde vienen** — tres distribuciones con barras (mobile/tablet/desktop · idioma del navegador · WhatsApp/Instagram/Facebook/buscador/directo/otra).
- **Temporada vista** — qué variantes están eligiendo los visitantes (solo aplica si el menú tiene variantes).

**Contenido del menú (tab secundaria)** — resumen estático del contenido publicado: secciones, platillos, precios (promedio/mediana/min/max + histograma de 5 buckets), top 5 más caros/económicos, calidad del contenido (% con precio / descripción / badges), etiquetas más comunes, lista de temporadas y estructura técnica.

### Preview automático que coincide con el header

Cada vez que se publica una invitación o menú, se regenera una **tarjeta de preview 1200×630** que replica el diseño del header — no un fondo plano genérico — y se sube como asset normal vía `/api/assets`. La URL queda guardada en `globalSettings.autoPreviewImage` y `pickShareImage` la prefiere por encima de cualquier otra imagen (header.backgroundImage, logo, gallery, etc.) porque suele verse mejor en el inline preview de WhatsApp/iMessage que una foto cruda.

[`generatePreviewImage.ts`](src/utils/generatePreviewImage.ts) toma un **snapshot del header** para componer la tarjeta:

- Si hay `menu-header` o `hero` con `backgroundImage` la carga con CORS y la pinta como fondo (cover), con el mismo scrim oscuro `rgba(0,0,0,0.45)` que el header publicado usa para legibilidad.
- Si no hay imagen del header pero sí `globalSettings.pageBackground` y resuelve a imagen (no video), la usa como fondo. Esto resuelve el caso anterior donde menús con sólo "Fondo de página" no obtenían preview.
- Si no hay imagen alguna, dibuja una tarjeta con `backgroundColor` del header + marco doble en color de acento + vignette sutil.
- Logo del menú-header se dibuja arriba del título cuando existe (`showLogo + logo`).
- El subtítulo / tagline se renderiza letter-spaced y en mayúsculas para menús (espejando lo que hace `menu-header`); para invitaciones es un eyebrow normal + divider decorativo.
- Color del texto = `block.style.textColor` si está, blanco si hay imagen detrás (legibilidad), o auto-contraste vs `backgroundColor` en caso contrario.

La generación pasa siempre, sin importar si el invitación ya tenía imagen propia — la tarjeta diseñada integra esa imagen pero queda con un look coherente con la marca. Falla silenciosa si la imagen no carga (CORS, 404) → publica igual, simplemente sin og:image custom esa vez.

### Nombre de la pestaña del navegador

En **Detalles** → **"Nombre en la pestaña"** se puede personalizar el `document.title` que ven los invitados en su navegador. Si se deja vacío, se usa el `invitation.title`. Aplicado vía `usePageChrome` ([src/hooks/usePageChrome.ts](src/hooks/usePageChrome.ts)) que guarda/restaura el título original al montar/desmontar.

### Skeletons de carga públicos

Cuando un invitado abre el link público (`?id=<slug>`) ya no se ve el texto "Cargando invitación…". En su lugar se renderiza un skeleton (silueta gris con `animate-pulse`) específico al tipo de documento. Los skeletons viven en [`src/components/public/skeletons.tsx`](src/components/public/skeletons.tsx):

- **InvitationSkeleton** — hero alto con título/subtítulo, tarjeta de event details, 3 items de timeline con bullet circular, área RSVP y footer.
- **MenuSkeleton** — header con logo redondo + título, barra sticky de nav pills, dos secciones con 4 platillos cada una (nombre + descripción + precio a la derecha), footer.
- **NeutralSkeleton** — fallback genérico (header + 3 bandas de contenido) para la primerísima visita a un slug que aún no se conoce.

Para decidir qué skeleton mostrar antes de que llegue la data, cacheamos el `kind` por slug en `localStorage` bajo la clave `invitation-builder:kind-cache:<slug>`. La primera vez que `App.tsx` recibe la `Invitation` del servidor, escribe el kind al cache; visitas posteriores muestran el skeleton correcto desde el primer paint. Visitas en frío (sin cache) muestran el `NeutralSkeleton`.

### Intro de sobre animado (greenvelope-style)

Las invitaciones pueden activar una intro previa en la que aparece un sobre cerrado centrado en pantalla; al tocarlo (o por auto-apertura) la solapa rota hacia atrás y la tarjeta sale del sobre antes de mostrar la invitación real. Se configura desde **Detalles → "Intro de sobre"** y se renderiza en la vista pública vía [EnvelopeIntro](src/components/public/EnvelopeIntro.tsx).

- **Toggle de activación** — sólo aparece en invitaciones (no menús).
- **Colores** — sobre, forro (interior del sobre, visible al abrir) y fondo del overlay. Pickers nativos + input hex.
- **Nombre del invitado** — se imprime en el frente del sobre, con tipografía serif itálica.
- **Monograma / iniciales** — texto corto sobre el nombre y dentro del sello de cera.
- **Imagen del frente (opcional)** — URL de una imagen que se ve en la tarjeta cuando emerge del sobre. Si se deja vacía, la tarjeta muestra el nombre + "Te esperamos".
- **Sello de cera** — toggle con color custom. Aparece centrado en la solapa.
- **Abrir automáticamente** — si está apagado, el invitado toca el sobre. Si está encendido, se abre solo después de ~1.2 s.
- **Texto pista** — frase que aparece en una pastilla pulsante debajo del sobre cerrado (default "Toca para abrir").
- **Botón "Ver vista previa"** — monta el mismo componente en modo `demo` para validar el render sin tener que publicar.

Capas del sobre (de fondo a frente, z-index):

1. **Back panel** (env color) — base rectangular siempre visible detrás.
2. **Lining** (lining color, opacity 0→1) — interior del sobre revelado al abrir.
3. **Card** (cream o imagen custom) — la tarjeta misma, oculta inicialmente; con la animación sube en `y` y crece levemente.
4. **Front pocket** (env color, polygon pentagonal con V-peak hacia arriba a 55%) — cubre las cuñas laterales superiores + toda la mitad inferior.
5. **Flap** (env color con gradiente, polygon triangular `(0,0)-(100%,0)-(50%,55%)`) — solapa con `backfaceVisibility: hidden` y rotación `rotateX 0→180°` para abrirse.

Las geometrías de las dos capas verdes son complementarias: comparten un mismo vértice central a `FLAP_APEX_PCT=55%` y juntas tilean todo el sobre sin huecos cuando la solapa está cerrada. Cuando la solapa rota más allá de los 90° su backface se oculta, dejando al descubierto el forro + la tarjeta que sube.

La intro se muestra **una sola vez por sesión** del invitado: tras completarse (o tras pulsar **"Saltar"**), `sessionStorage` guarda `envelope-intro:<id>=1` y los siguientes refreshes saltan el overlay. El scroll se bloquea (`document.body.overflow = 'hidden'`) mientras la intro está visible. El estado interno avanza `closed → opening → leaving → gone`; al llegar a `gone` se llama `onDone()` y la invitación real toma el foco.

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

## Backend en Hostinger (Express + filesystem)

El backend vive en un repo separado (`redspartan33/invitaciones-api`) como app
Express normal y corre en un Node.js App de Hostinger en `api.lamartinasma.com`.
Guarda cada invitación como un archivo JSON en `data/inv/<slug>.json` y las
imágenes subidas en `uploads/<folder>/<file>` del propio servidor.

> Cómo llegamos aquí: el backend original era un set de Vercel Functions sobre
> Vercel Blob. Migrado en mayo 2026 para no pagar Vercel Pro — todos los datos
> existentes se movieron con `/tmp/migration/migrate.mjs` (script de un solo
> uso, no versionado).

**Endpoints (origen `https://api.lamartinasma.com`):**

```
GET    /api/health                       → { ok: true }
GET    /api/diag                         → { writeOk, readOk, storage, … }
PUT    /api/invitations/<slug>           → { ok: true }    (body: Invitation JSON)
GET    /api/invitations/<slug>           → Invitation JSON | 404
DELETE /api/invitations/<slug>           → { ok: true }
GET    /api/invitations/index            → [Invitation, …]   (todas)
DELETE /api/invitations/index?id=<slug>  → { ok: true }
POST   /api/assets                       → { url } (sube data URI; devuelve URL absoluta)
GET    /api/asset/<folder>/<file>        → bytes del archivo
GET    /api/guestlists/<slug>            → [GuestEntry, …]
POST   /api/guestlists/<slug>            → { ok: true, entry }
PUT    /api/guestlists/<slug>            → { ok: true }   (inicializa vacía)
GET    /share/<slug>                     → HTML con og:title/og:image (preview WhatsApp)
```

### Storage persistente — IMPORTANTE

Hostinger borra `~/domains/api.lamartinasma.com/nodejs/` en cada redeploy
(swap atómico con un clone limpio del repo). Por eso el backend guarda
los datos **fuera** del directorio de la app, en `$HOME` que sí persiste:

- Invitaciones JSON: `~/lamartinasma-data/inv/<slug>.json`
- Guestlists JSON:   `~/lamartinasma-data/guests/<slug>.json`
- Imágenes subidas:  `~/lamartinasma-uploads/<folder>/<file>`

Las rutas se pueden sobrescribir con `DATA_DIR` y `UPLOADS_DIR` en
variables de entorno si en el futuro hay que moverlas a otro disco /
volumen montado. **Nunca** apuntar de vuelta a algo dentro del repo:
el siguiente push borraría las invitaciones de los clientes.

### Preview de WhatsApp / iMessage / Twitter

El editor copia URLs con la forma `https://api.lamartinasma.com/share/<slug>`.
Esa ruta lee la invitación, escoge la mejor imagen disponible (page
background → hero → menu-header → cualquier imagen de bloque) y devuelve
un HTML estático con etiquetas `og:title` / `og:image` / `og:description`
+ `twitter:card`, más un `<meta http-equiv="refresh">` que redirige al
humano a la SPA en lamartinasma.com. Los scrapers ven el preview, los
visitantes ven la invitación normal.

### Cómo se compone la URL desde el frontend

`src/utils/apiBase.ts` expone `apiUrl(path)`. En dev devuelve una ruta relativa
y el `vite.config.ts` proxea `/api` a `http://localhost:5050` (donde corres el
Express local). En build de producción devuelve el origen absoluto
`https://api.lamartinasma.com`, así el frontend en `lamartinasma.com` apunta a
otro origen sin ningún truco extra del lado del servidor.

### Levantar el backend en local

```bash
cd ../invitaciones-api   # repo separado
npm install
npm start                 # escucha en :5050
```

El frontend en `npm run dev` proxea `/api` ahí.

### Garantía de publicación

`publishInvitation` es atómico: marca la invitación como `published` **solo**
si el servidor aceptó el `PUT`. Si falla, el popover de Compartir muestra el
error y la invitación se queda en `draft`. Nunca generamos links rotos.
