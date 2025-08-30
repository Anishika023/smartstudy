// app.js - frontend logic (vanilla JS)
const api = (path, opts = {}) => fetch(path, opts).then(r => r.json());

const noteForm = document.getElementById('noteForm');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const fileInput = document.getElementById('file');
const noteIdInput = document.getElementById('noteId');
const notesContainer = document.getElementById('notesContainer');
const resetBtn = document.getElementById('resetBtn');

async function loadNotes(){
  const res = await api('/api/notes');
  if (res.ok) {
    renderNotes(res.notes);
  } else {
    notesContainer.innerHTML = '<div>Error loading notes</div>';
  }
}

function renderNotes(notes){
  if (!notes.length) {
    notesContainer.innerHTML = '<div>No notes yet — create one!</div>';
    return;
  }
  notesContainer.innerHTML = notes.map(n => {
    const short = n.content ? (n.content.length>120 ? n.content.slice(0,120)+'…' : n.content) : '';
    const fileHtml = n.filename ? `<div><a href="/uploads/${n.filename}" target="_blank">Attachment</a></div>` : '';
    const date = new Date(n.updated_at).toLocaleString();
    return `
      <div class="note-card" data-id="${n.id}">
        <h3>${escapeHtml(n.title)}</h3>
        <p>${escapeHtml(short)}</p>
        ${fileHtml}
        <small>Updated: ${date}</small>
        <div class="note-actions">
          <button data-op="edit">Edit</button>
          <button data-op="delete">Delete</button>
        </div>
      </div>
    `;
  }).join('');
  // attach handlers
  document.querySelectorAll('.note-card').forEach(card => {
    card.querySelector('[data-op="edit"]').addEventListener('click', () => startEdit(card.dataset.id));
    card.querySelector('[data-op="delete"]').addEventListener('click', () => handleDelete(card.dataset.id));
  });
}

function escapeHtml(s = '') {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function startEdit(id){
  const res = await api('/api/notes/' + id);
  if (!res.ok) return alert('Note not found');
  const n = res.note;
  noteIdInput.value = n.id;
  titleInput.value = n.title;
  contentInput.value = n.content;
  // file input cannot be populated for security reasons
  window.scrollTo({top:0,behavior:'smooth'});
}

async function handleDelete(id){
  if (!confirm('Delete this note?')) return;
  const res = await api('/api/notes/' + id, { method: 'DELETE' });
  if (res.ok) {
    await loadNotes();
  } else {
    alert('Failed to delete');
  }
}

noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = noteIdInput.value;
  const formData = new FormData();
  formData.append('title', titleInput.value);
  formData.append('content', contentInput.value);
  if (fileInput.files[0]) formData.append('file', fileInput.files[0]);

  if (id) {
    const res = await fetch('/api/notes/' + id, { method: 'PUT', body: formData });
    const data = await res.json();
    if (data.ok) {
      resetForm();
      loadNotes();
    } else {
      alert('Update failed');
    }
  } else {
    const res = await fetch('/api/notes', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.ok) {
      resetForm();
      loadNotes();
    } else {
      alert('Create failed');
    }
  }
});

resetBtn.addEventListener('click', resetForm);

function resetForm(){
  noteIdInput.value = '';
  titleInput.value = '';
  contentInput.value = '';
  fileInput.value = '';
}

loadNotes();
