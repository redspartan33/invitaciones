import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/'));
  },
});

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file or unsupported type' });
  const origin = `${req.protocol}://${req.get('host')}`;
  res.status(201).json({ url: `${origin}/uploads/${req.file.filename}` });
});

// GET all
app.get('/api/invitations', async (req, res) => {
  try {
    const invitations = await prisma.invitation.findMany({
      include: { guests: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// GET one
app.get('/api/invitations/:id', async (req, res) => {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: req.params.id },
      include: { guests: true }
    });
    if (!invitation) return res.status(404).json({ error: 'Not found' });
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      return res.status(410).json({ error: 'Expired' });
    }
    res.json(invitation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// POST create
app.post('/api/invitations', async (req, res) => {
  try {
    const { title, htmlContent, config } = req.body;
    if (!title || !htmlContent) {
      return res.status(400).json({ error: 'Title and htmlContent required' });
    }
    const invitation = await prisma.invitation.create({
      data: { title, htmlContent, config: config || {}, status: 'draft' }
    });
    res.status(201).json(invitation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create' });
  }
});

// PUT update
app.put('/api/invitations/:id', async (req, res) => {
  try {
    const { title, htmlContent, config } = req.body;
    const invitation = await prisma.invitation.update({
      where: { id: req.params.id },
      data: { title, htmlContent, config }
    });
    res.json(invitation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// DELETE
app.delete('/api/invitations/:id', async (req, res) => {
  try {
    await prisma.invitation.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// POST publish
app.post('/api/invitations/:id/publish', async (req, res) => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const invitation = await prisma.invitation.update({
      where: { id: req.params.id },
      data: { status: 'published', publishedAt: new Date(), expiresAt }
    });
    res.json(invitation);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// GET guests
app.get('/api/invitations/:id/guests', async (req, res) => {
  try {
    const guests = await prisma.guest.findMany({
      where: { invitationId: req.params.id },
      orderBy: { confirmedAt: 'desc' }
    });
    res.json(guests);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// POST guest
app.post('/api/invitations/:id/guests', async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const invitation = await prisma.invitation.findUnique({
      where: { id: req.params.id }
    });
    if (!invitation) return res.status(404).json({ error: 'Not found' });
    if (invitation.status !== 'published') {
      return res.status(403).json({ error: 'Not published' });
    }
    const guest = await prisma.guest.create({
      data: { invitationId: req.params.id, name, message: message || null }
    });
    res.status(201).json(guest);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
