# Digital Invitation Builder

App full-stack para crear invitaciones digitales por secciones (editor estilo Elementor), con confirmación de asistencia vía WhatsApp y panel de administración.

## Estado actual

- **Admin** (`/admin`): lista de invitaciones — crear, editar, ver, copiar link, eliminar.
- **Editor estilo Elementor** (`/editor/:id`): lienzo vivo, selección de elemento + panel lateral, paleta de widgets, drag & drop. UI plana (sin sombras).
- **Bloques**: Título, Texto, Imagen, Video. Por bloque: color de fondo, color de texto, espaciado interno, espacio entre secciones y animación de entrada (aparecer / deslizar / zoom).
- **Media**: upload real de imágenes/videos al backend (multer).
- **Vista pública** (`/invitations/:id`): invitación renderizada + confirmación por WhatsApp.
- **Invitados** (`/invitations/:id/guests`): lista de confirmados.

## Stack

React 18 + TypeScript + Tailwind + Vite · Node.js + Express + Prisma · PostgreSQL · @dnd-kit

## Setup local

### 1. Requisitos
- Node.js 18+
- PostgreSQL 14+

### 2. Base de datos
```bash
createdb invitation_builder_dev
```

### 3. Variables de entorno

`backend/.env` (ajusta usuario/clave a tu Postgres):
```
DATABASE_URL="postgresql://<usuario>@localhost:5432/invitation_builder_dev"
PORT=5050
NODE_ENV=development
```
> Nota: el puerto del backend es **5050** (en macOS el 5000 lo ocupa AirPlay/ControlCenter). El proxy del frontend (`vite.config.ts`) apunta a `:5050`.

### 4. Instalación

**Backend:**
```bash
cd backend
npm install
npx prisma db push   # aplica el esquema (db push, no migrate dev)
npm run dev
```

**Frontend** (otra terminal):
```bash
cd frontend
npm install
npm run dev
```

### 5. URLs
- Frontend: http://localhost:5173 (redirige a `/admin`)
- Backend API: http://localhost:5050

## API

```
GET    /api/health
GET    /api/invitations
GET    /api/invitations/:id
POST   /api/invitations
PUT    /api/invitations/:id
DELETE /api/invitations/:id
POST   /api/invitations/:id/publish
GET    /api/invitations/:id/guests
POST   /api/invitations/:id/guests
POST   /api/upload                  # multipart, devuelve { url }
GET    /uploads/:file               # archivos subidos (disco local)
```

## Estructura

```
invitation-builder/
├── backend/
│   ├── src/server.ts          # Express: invitaciones, guests, upload
│   ├── prisma/schema.prisma
│   └── uploads/               # archivos subidos (gitignored)
├── frontend/
│   └── src/
│       ├── blocks.ts          # modelo de bloques + generación de HTML
│       ├── components/
│       │   ├── Admin.tsx
│       │   ├── Editor.tsx     # builder estilo Elementor
│       │   ├── InvitationLanding.tsx
│       │   └── GuestsPage.tsx
│       └── App.tsx
└── docs/
    └── DEPLOY_HOSTINGER.md    # guía de despliegue
```

## Despliegue

Ver [docs/DEPLOY_HOSTINGER.md](docs/DEPLOY_HOSTINGER.md). Resumen: opción recomendada es Hostinger "Node.js Web App" (Business/Cloud) + Postgres gestionada; antes de producción hay que mover los uploads de disco local a object storage (R2/S3).

## Comandos útiles

**Backend:** `npm run dev` · `npm run build` · `npm run type-check` · `npx prisma studio`
**Frontend:** `npm run dev` · `npm run build` · `npx tsc --noEmit`

---

**Stack**: React 18 + TS + Tailwind | Express + Prisma | PostgreSQL
