# Publicar en Hostinger

La app es full-stack (Express + PostgreSQL + uploads de archivos), **no es un sitio estático**, así que el hosting compartido clásico de Hostinger no la corre tal cual. Estas son las opciones reales, de la más simple a la más manual.

---

## Opción A — Hostinger "Node.js Web Apps" (planes Business / Cloud) — recomendada

Hosting gestionado: conectas el repo, Hostinger hace build, deploy y SSL.

### Pasos
1. Plan Business o Cloud en Hostinger (los que incluyen "Node.js Web Apps" en hPanel).
2. En hPanel → **Websites → Web Apps → Create** → conecta GitHub (`redspartan33/invitaciones`).
3. Base de datos PostgreSQL:
   - Hostinger PostgreSQL gestionada, **o** una externa gratis (Neon / Supabase).
   - Copia su connection string.
4. Configura **dos** apps (o un monorepo con dos build targets):
   - **backend** — root `backend/`, build `npm install && npx prisma generate && npm run build`, start `node dist/server.js`.
   - **frontend** — root `frontend/`, build `npm install && npm run build`, sirve la carpeta `frontend/dist` como estática.
5. Variables de entorno del backend (hPanel → Environment, **no** las subas al repo):
   ```
   DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/<db>
   PORT=<el que asigne Hostinger>
   NODE_ENV=production
   ```
6. Aplica el esquema una vez contra la BD de producción:
   ```
   DATABASE_URL="<prod-url>" npx prisma db push
   ```
7. Apunta el dominio/subdominio al frontend. Los links públicos quedan como
   `https://tudominio.com/invitations/<id>`.

### ⚠️ Ajuste necesario antes de este deploy
- **Uploads:** hoy se guardan en disco local (`backend/uploads/`). El hosting gestionado es efímero → esos archivos se borran en cada deploy. Hay que mover el upload a almacenamiento de objetos (Cloudflare R2 / S3) y guardar la URL pública. (Ya estaba en el roadmap de Fase 2 como "Media Management".)
- **API base URL:** en dev el frontend usa el proxy de Vite a `:5050`. En producción hay que servir el frontend y backend bajo el mismo dominio (o configurar `VITE_API_URL`) para que `/api` y `/uploads` resuelvan.
- **CORS / origin de uploads:** el backend arma la URL del archivo con `req.get('host')`; detrás del proxy de Hostinger funciona, pero verifica que devuelva el dominio público (no `localhost`).

---

## Opción B — Hostinger VPS

Control total. Más setup manual, pero los uploads en disco **sí** persisten.

1. VPS con Ubuntu en Hostinger.
2. Instala Node 18+, PostgreSQL, Nginx, PM2.
3. `git clone` del repo, `npm install` en `backend/` y `frontend/`.
4. `frontend`: `npm run build` → sirve `frontend/dist` con Nginx.
5. `backend`: `npm run build` → `pm2 start dist/server.js`.
6. Nginx como reverse proxy: `/` → `dist` estático, `/api` y `/uploads` → backend (PM2).
7. Postgres local en el VPS; `npx prisma db push` con la `DATABASE_URL` local.
8. Certbot para HTTPS.

---

## Opción C — Split

Frontend estático en Hostinger compartido + backend/BD en otro Node host (Render/Railway/Fly) + Postgres gestionada (Neon/Supabase). Más piezas que mantener; solo si ya tienes el plan compartido y no quieres cambiarlo.

---

## Resumen

| | Esfuerzo | Uploads persisten | Recomendado para |
|---|---|---|---|
| A. Node.js Web App | Bajo | No (requiere object storage) | Lanzar rápido con dominio propio |
| B. VPS | Alto | Sí | Control total / sin tocar uploads |
| C. Split | Medio | Depende del host backend | Reusar hosting compartido existente |

**Recomendación:** Opción A + mover uploads a object storage (R2). Cuando quieras, dejo el proyecto listo para ese deploy (server sirviendo el frontend buildeado, `VITE_API_URL`, y el cambio de uploads a R2).
