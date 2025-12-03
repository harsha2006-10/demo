// Simple todo app with localStorage, filters, import/export, edit, delete.
const STORAGE_KEY = 'harsha_todo_v1';
let todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let filter = 'all';

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

const listEl = $('#todo-list');
const form = $('#todo-form');
const input = $('#todo-input');
const emptyEl = $('#empty');

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); render(); }

function createTodo(text){
  return { id: Date.now().toString(), text: text.trim(), done: false };
}

function addTodo(text){
  if (!text || !text.trim()) return;
  todos.unshift(createTodo(text));
  input.value = '';
  save();
}

function toggleDone(id){
  todos = todos.map(t => t.id === id ? {...t, done: !t.done} : t);
  save();
}

function deleteTodo(id){
  todos = todos.filter(t => t.id !== id);
  save();
}

function editTodo(id, newText){
  todos = todos.map(t => t.id === id ? {...t, text: newText.trim()} : t);
  save();
}

function clearCompleted(){
  todos = todos.filter(t => !t.done);
  save();
}

function setFilter(f){
  filter = f;
  $$('.filter').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === f));
  render();
}

function filteredTodos(){
  if (filter === 'active') return todos.filter(t => !t.done);
  if (filter === 'completed') return todos.filter(t => t.done);
  return todos;
}

function render(){
  listEl.innerHTML = '';
  const items = filteredTodos();
  if (!todos.length) {
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = items.length ? 'none' : 'block';
  }

  items.forEach(t => {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.innerHTML = `
      <div class="left">
        <button class="checkbox ${t.done ? 'checked' : ''}" aria-label="Mark done">${t.done ? '✓' : ''}</button>
        <div class="task-text ${t.done ? 'completed' : ''}">${escapeHtml(t.text)}</div>
      </div>
      <div class="actions-right">
        <button class="icon-btn edit">✎</button>
        <button class="icon-btn delete">🗑</button>
      </div>
    `;
    // handlers
    li.querySelector('.checkbox').addEventListener('click', () => toggleDone(t.id));
    li.querySelector('.delete').addEventListener('click', () => {
      if (confirm('Delete this task?')) deleteTodo(t.id);
    });
    li.querySelector('.edit').addEventListener('click', () => {
      const newText = prompt('Edit task', t.text);
      if (newText !== null) editTodo(t.id, newText);
    });
    listEl.appendChild(li);
  });
}

function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// Events
form.addEventListener('submit', e => { e.preventDefault(); addTodo(input.value); });
$$('.filter').forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
$('#clear-completed').addEventListener('click', () => { clearCompleted(); });
$('#export-json').addEventListener('click', () => {
  const data = JSON.stringify(todos, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'harsha-todos.json'; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
});
$('#import-file').addEventListener('change', function(){
  const file = this.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error('Invalid file');
      // basic validation and merge
      const valid = imported.filter(i => i && i.text).map(i => ({ id: i.id || Date.now()+Math.random(), text: String(i.text), done: !!i.done }));
      todos = [...valid, ...todos];
      save(); alert('Imported ' + valid.length + ' tasks.');
    } catch(err) { alert('Import failed: ' + err.message); }
  };
  reader.readAsText(file);
  this.value = '';
});

// initial render
render();