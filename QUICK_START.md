# ⚡ Quick Reference

## 🚀 Start Development (2 terminals)

### Terminal 1: Backend
```bash
cd backend
npm install    # First time only
npm run dev    # Starts on :5000
```

### Terminal 2: Frontend
```bash
cd frontend
npm install    # First time only
npm run dev    # Starts on :5173
```

### ✅ You should see:
```
✅ Server running at http://localhost:5000
➜  Local:   http://localhost:5173/
```

---

## 🧠 What Works Now

✅ Create invitations with simple form
✅ View invitations with beautiful HTML preview
✅ Confirm attendance (name + optional message)
✅ See list of confirmed guests
✅ WhatsApp integration (link share)
✅ Real-time guest count
✅ Publish/unpublish invitations
✅ Auto-expire invitations (7 days)

---

## 📍 Important URLs

| What | URL |
|------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend** | http://localhost:5000 |
| **Create Invitation** | http://localhost:5173/editor |
| **View Invitation** | http://localhost:5173/invitations/[ID] |
| **See Guests** | http://localhost:5173/invitations/[ID]/guests |
| **Database GUI** | Run: `cd backend && npx prisma studio` → http://localhost:5555 |

---

## 📊 Database Commands

```bash
cd backend

# View database visually
npx prisma studio

# Create a migration after schema changes
npx prisma migrate dev --name your_change_name

# Reset database (WARNING: deletes all data!)
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate
```

---

## 🐛 Troubleshooting

### "Cannot connect to PostgreSQL"
```bash
# macOS
brew services start postgresql

# Docker (if using Docker)
docker start pg-invitation

# Windows
# Go to Services.msc and start PostgreSQL
```

### "Port 5000 already in use"
```bash
# Find what's using it
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill it or use different port
PORT=5001 npm run dev
```

### "Vite dev server won't start"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📦 Project Structure Quick View

```
invitation-builder/
├── backend/                    API + Database
│   ├── src/server.ts          All endpoints
│   ├── prisma/schema.prisma   DB tables
│   └── .env                   Database URL
│
├── frontend/                   React App
│   ├── src/components/
│   │   ├── Editor.tsx         Create invitations
│   │   ├── InvitationLanding.tsx  View invitation
│   │   └── GuestsPage.tsx     See guests
│   └── .env.local             Backend URL
│
└── docs/                       Documentation
    └── GETTING_STARTED.md    Full setup guide
```

---

## 🎯 Typical Workflow

1. **Start both servers** (see above)
2. **Open** http://localhost:5173
3. **Create invitation** → fill form → submit
4. **Copy link** from success message
5. **Open link** in new window to see invitation
6. **Confirm attendance** → opens WhatsApp
7. **Check guests** → see updated list

---

## 💾 Environment Files

Create these files from `.example` versions:

**Backend:** `backend/.env`
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/invitation_builder_dev"
PORT=5000
NODE_ENV=development
```

**Frontend:** `frontend/.env.local`
```
VITE_API_URL=http://localhost:5000
```

---

## 🔄 Git Workflow (if using git)

```bash
# Don't commit these!
*.env
*.env.local
node_modules/
dist/
.DS_Store
```

---

## 📚 Next Phase: Adding Features

See `docs/PHASE_1_PROGRESS.md` for what's next:
- Visual editor for backgrounds/colors
- Media upload (photos/videos)
- Image galleries and carousels
- Audio backgrounds

---

**Everything works!** 🎉
If any issues, check the GETTING_STARTED.md for detailed setup
