// db.js - simple SQLite wrapper using better-sqlite3
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'data.db'));

function init() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      filename TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `).run();
}

function createNote(note) {
  const stmt = db.prepare(`INSERT INTO notes (id,title,content,filename,created_at,updated_at) VALUES (@id,@title,@content,@filename,@created_at,@updated_at)`);
  return stmt.run(note);
}

function getAllNotes() {
  return db.prepare(`SELECT id,title,content,filename,created_at,updated_at FROM notes ORDER BY updated_at DESC`).all();
}

function getNoteById(id) {
  return db.prepare(`SELECT * FROM notes WHERE id = ?`).get(id);
}

function updateNote(id, data) {
  const stmt = db.prepare(`UPDATE notes SET title=@title,content=@content,filename=@filename,updated_at=@updated_at WHERE id=@id`);
  return stmt.run({...data, id});
}

function deleteNote(id) {
  return db.prepare(`DELETE FROM notes WHERE id = ?`).run(id);
}

module.exports = { init, createNote, getAllNotes, getNoteById, updateNote, deleteNote };
