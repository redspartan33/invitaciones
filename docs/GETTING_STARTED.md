# Getting Started Guide - Digital Invitation Builder

## 🚀 Quick Start (5 minutos)

### Requisitos Previos
- **Node.js 18+** - https://nodejs.org
- **PostgreSQL 14+** - https://postgresql.org
- **npm** (viene con Node.js)

---

## 📋 Opción 1: Setup Automático (Recomendado)

```bash
# En la raíz del proyecto
chmod +x setup.sh
./setup.sh
```

Esto hará todo automáticamente:
✅ Instala dependencias
✅ Crea variables de entorno
✅ Configura la base de datos

Después simplemente abre 2 terminales y ejecuta:
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## 📋 Opción 2: Setup Manual Paso a Paso

### Paso 1: Configurar PostgreSQL

#### macOS (Homebrew)
```bash
brew install postgresql
brew services start postgresql
createdb invitation_builder_dev
```

#### Windows (Instalador)
1. Descarga desde https://postgresql.org/download/windows
2. Durante instalación:
   - Password: `postgres` (o tu preferencia)
   - Puerto: `5432` (default)
3. Crea la base de datos:
```bash
psql -U postgres -c "CREATE DATABASE invitation_builder_dev;"
```

#### Docker (Cualquier OS)
```bash
docker run --name pg-invitation \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=invitation_builder_dev \
  -p 5432:5432 \
  -d postgres:15
```

### Paso 2: Backend Setup

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env

# Instalar dependencias
npm install

# Crear tablas en la BD
npx prisma migrate dev --name init

# Iniciar servidor
npm run dev
```

Deberías ver:
```
✅ Server running at http://localhost:5000
📊 Database connected
```

### Paso 3: Frontend Setup (nueva terminal)

```bash
cd frontend

# Copiar variables de entorno
cp .env.example .env.local

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Deberías ver:
```
➜  Local:   http://localhost:5173/
```

---

## 🧪 Primeras Pruebas

1. **Abre en el navegador**: http://localhost:5173
2. **Crea una invitación**:
   - Título: "Cumpleaños María"
   - Descripción: "25 años"
   - Fecha: tu fecha favorita
   - Hora: 18:00
   - Lugar: Veracruz
3. **Copia el link** de la invitación creada
4. **Abre en otra ventana** la invitación
5. **Confirma asistencia** con tu nombre

---

## 🔧 Comandos Útiles

### Backend
```bash
# Modo desarrollo con auto-reload
npm run dev

# Compilar a JavaScript
npm run build

# Iniciar versión compilada
npm start

# Ver BD visualmente (Prisma Studio)
npx prisma studio

# Crear migración de cambios
npx prisma migrate dev --name nombre_cambio
```

### Frontend
```bash
# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview

# Type checking
npm run type-check
```

---

## 📚 Estructura de Carpetas

```
invitation-builder/
│
├─ backend/                    # API y Base de datos
│  ├─ src/
│  │  └─ server.ts            # Express server + endpoints
│  ├─ prisma/
│  │  └─ schema.prisma        # Definición de tablas
│  ├─ .env                    # Variables (no commitear!)
│  └─ package.json
│
├─ frontend/                   # React UI
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ Editor.tsx        # Panel de creación
│  │  │  ├─ InvitationLanding.tsx  # Vista de invitación
│  │  │  └─ GuestsPage.tsx    # Lista de invitados
│  │  ├─ App.tsx              # Router principal
│  │  └─ index.css            # Tailwind + estilos
│  ├─ .env.local              # Variables (no commitear!)
│  └─ package.json
│
└─ README.md                   # Este archivo
```

---

## 🔌 API Endpoints (FASE 1)

### Invitaciones
```
GET    /api/invitations              # Listar todas
GET    /api/invitations/:id          # Una invitación
POST   /api/invitations              # Crear
PUT    /api/invitations/:id          # Editar
DELETE /api/invitations/:id          # Eliminar
POST   /api/invitations/:id/publish  # Publicar
POST   /api/invitations/:id/unpublish # Despublicar
```

### Invitados
```
GET    /api/invitations/:id/guests          # Listar invitados
POST   /api/invitations/:id/guests          # Confirmar asistencia
```

---

## 🐛 Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:5432"
**Problema**: PostgreSQL no está corriendo
**Solución**:
```bash
# macOS
brew services start postgresql

# Docker
docker start pg-invitation

# Windows
# Abre "Services" y busca PostgreSQL
```

### Error: "PRISMA_QUERY_ENGINE_BINARY not found"
```bash
cd backend
npm install
npx prisma generate
```

### Frontend dice "Cannot GET /api/invitations"
**Problema**: Backend no está corriendo en puerto 5000
**Solución**: Revisa que esté ejecutándose:
```bash
lsof -i :5000    # macOS/Linux
netstat -ano | findstr :5000  # Windows
```

### Port 5173 ya está en uso
```bash
# Cambiar puerto en frontend
PORT=5174 npm run dev
```

---

## 📊 Ver BD Visualmente

```bash
cd backend
npx prisma studio
```

Abre http://localhost:5555 para ver y editar datos

---

## 🚀 Próximos Pasos

Una vez que funcione FASE 1:

**FASE 2 (próxima semana)**:
- [ ] Editor visual WYSIWYG
- [ ] Upload de medios (fotos/videos)
- [ ] Carruseles de imágenes
- [ ] Animaciones CSS

**FASE 3**:
- [ ] Cloudflare R2 integration
- [ ] Audio de fondo
- [ ] Más tipos de componentes

---

## 💬 Debugging

Abre la consola del navegador para errores del frontend:
```
Chrome/Firefox: F12 → Console
```

Mira los logs del backend en la terminal donde ejecutas `npm run dev`

---

¡Felicitaciones! 🎉 Ya deberías tener el MVP funcionando localmente.

Cualquier problema, revisa los logs y confirma que:
1. PostgreSQL está corriendo
2. Node.js es versión 18+
3. Los puertos 5000 y 5173 están disponibles
