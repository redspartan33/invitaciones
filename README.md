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

## Backend en Hostinger

El backend está deployado en Hostinger con Node.js + Express:

**API URL:** `https://api.lamartinasma.com` (requiere que crees la subdomain en cPanel)

### Endpoints

```
GET    /health                 → { status: "ok", timestamp: "..." }
PUT    /invitations/<id>       → { success: true, id: "<id>" }
GET    /invitations/<id>       → { Invitation JSON } | 404
DELETE /invitations/<id>       → { success: true } | 404
```

### Setup en Hostinger

El código del backend ya está en `/home/u814790894/domains/api.lamartinasma.com/public_html/`:

1. **Crea el subdomain en cPanel:**
   - Ve a **Addon Domains** o **Subdomains**
   - Nombre: `api.lamartinasma.com`
   - Document Root: `/home/u814790894/domains/api.lamartinasma.com/public_html`
   - Salva y espera a que DNS se propague (~5-15 min)

2. **Habilita Node.js (si no lo está):**
   - Ve a **Setup Node.js App** en cPanel
   - Si aparece el dominio, selecciona y aplica

3. **El app.js se ejecutará automáticamente con Passenger**
   - La app escucha en puerto 3000 internamente
   - Passenger expone a través de HTTPS (lamartinasma.com/api/)

### Almacenamiento

- Los datos se guardan en `/app/data/<id>.json`
- Máximo 50 MB por invitación
- Sin base de datos - escalable para primeras fases

### Sin backend

La app sigue funcionando sin API configurada:
- Guarda en `localStorage` (mismo navegador)
- Link portable: datos embebidos en el hash de la URL
- Útil para testing o compartir temporalmente
