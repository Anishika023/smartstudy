// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${file.originalname}`;
    cb(null, unique);
  }
});
const upload = multer({ storage });

const app = express();
db.init();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static frontend
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// API routes
app.get('/api/notes', (req, res) => {
  try {
    const notes = db.getAllNotes();
    res.json({ ok: true, notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
});

app.get('/api/notes/:id', (req, res) => {
  const note = db.getNoteById(req.params.id);
  if (!note) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, note });
});

app.post('/api/notes', upload.single('file'), (req, res) => {
  try {
    const { title = 'Untitled', content = '' } = req.body;
    const filename = req.file ? req.file.filename : null;
    const id = uuidv4();
    const now = Date.now();
    db.createNote({ id, title, content, filename, created_at: now, updated_at: now });
    res.json({ ok: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'could not create' });
  }
});

app.put('/api/notes/:id', upload.single('file'), (req, res) => {
  try {
    const id = req.params.id;
    const exist = db.getNoteById(id);
    if (!exist) return res.status(404).json({ ok: false, error: 'not found' });
    let filename = exist.filename;
    if (req.file) {
      // delete old file if present
      if (filename) {
        const oldPath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      filename = req.file.filename;
    }
    const now = Date.now();
    db.updateNote(id, { title: req.body.title || exist.title, content: req.body.content || exist.content, filename, updated_at: now });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'could not update' });
  }
});

app.delete('/api/notes/:id', (req, res) => {
  try {
    const id = req.params.id;
    const note = db.getNoteById(id);
    if (!note) return res.status(404).json({ ok: false, error: 'not found' });
    if (note.filename) {
      const filePath = path.join(UPLOAD_DIR, note.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    db.deleteNote(id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'could not delete' });
  }
});

// fallback to index.html for SPA routing (if you expand)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
