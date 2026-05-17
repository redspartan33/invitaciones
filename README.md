# Digital Invitation Builder - MVP (FASE 1)

## Setup Rápido (5 minutos)

### 1. Requisitos
- Node.js 18+
- PostgreSQL 14+ (local o Docker)
- npm o yarn

### 2. PostgreSQL Local Setup

**Opción A: Usando Homebrew (macOS)**
```bash
brew install postgresql
brew services start postgresql
createdb invitation_builder_dev
```

**Opción B: Docker**
```bash
docker run --name pg-invitation \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=invitation_builder_dev \
  -p 5432:5432 \
  -d postgres:15
```

**Opción C: Windows/Instalador**
- Descarga PostgreSQL desde postgresql.org
- Durante la instalación, crea DB `invitation_builder_dev`
- Default: user=postgres, password=postgres, host=localhost:5432

### 3. Variables de Entorno

**Backend** `.env`
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/invitation_builder_dev"
PORT=5000
NODE_ENV=development
```

**Frontend** `.env.local`
```
VITE_API_URL=http://localhost:5000
```

### 4. Instalación

**Backend:**
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

**Frontend** (nueva terminal):
```bash
cd frontend
npm install
npm run dev
```

### 5. URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Database: postgresql://localhost:5432

---

## Estructura del Proyecto

```
invitation-builder/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── invitations.ts
│   │   ├── controllers/
│   │   │   └── invitationController.ts
│   │   ├── db.ts
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor.tsx
│   │   │   ├── Preview.tsx
│   │   │   └── InvitationLanding.tsx
│   │   ├── pages/
│   │   │   ├── /editor
│   │   │   ├── /invitations/:id
│   │   │   └── /invitations/:id/guests
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.local
│   ├── vite.config.ts
│   └── package.json
└── README.md (este archivo)
```

---

## Flujo de Desarrollo FASE 1

### Sprint 1: Estructura Base
- [x] Setup React + Vite
- [x] Setup Express + TypeScript
- [x] Schema Prisma
- [ ] API CRUD básica
- [ ] Formulario de entrada de texto
- [ ] Preview estático

### Sprint 2: Landing Page + Confirmación
- [ ] Landing page de invitación
- [ ] Formulario de confirmación
- [ ] Guardar en BD
- [ ] Página de invitados

---

## Comandos Útiles

**Backend:**
```bash
npm run dev              # Iniciar servidor
npx prisma studio      # Ver BD visualmente
npx prisma generate    # Regenerar tipos
npx prisma migrate dev # Crear migración
```

**Frontend:**
```bash
npm run dev             # Vite dev server
npm run build           # Build para producción
```

---

## Próximos Pasos (FASE 2+)

- Editor visual WYSIWYG
- Upload de medios
- Cloudflare R2 integration
- Animaciones
- Audio de fondo

---

**Creado**: Mayo 2026
**Stack**: React 18 + TypeScript + Tailwind | Node.js + Express + Prisma | PostgreSQL
