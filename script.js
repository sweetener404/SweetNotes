// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDWIE1bWqQ3f7PJpdEO6wEh5awmhuSBJ_o",
    authDomain: "sweetener-notes.firebaseapp.com",
    projectId: "sweetener-notes",
    storageBucket: "sweetener-notes.firebasestorage.app",
    messagingSenderId: "512242221851",
    appId: "1:512242221851:web:7f998b14eef56ae8ca49be"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global variables
let notes = [];
let currentNoteId = null;
let currentUser = null;
let isSignUp = false;

// Auth State Management
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        document.getElementById('userEmail').textContent = user.email;
        loadUserNotes();
    } else {
        currentUser = null;
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        notes = [];
    }
});

// Auth Form Handling
document.addEventListener('DOMContentLoaded', function() {
    const authButton = document.getElementById('authButton');
    const authToggleLink = document.getElementById('authToggleLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (authButton) {
        authButton.addEventListener('click', handleAuth);
    }
    
    if (authToggleLink) {
        authToggleLink.addEventListener('click', toggleAuthMode);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.signOut());
    }

    // Enter key support for auth form
    if (emailInput) {
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAuth();
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAuth();
        });
    }

    // Mobile navigation
    setupMobileNavigation();
});

function toggleAuthMode() {
    isSignUp = !isSignUp;
    const authButton = document.getElementById('authButton');
    const authToggleText = document.getElementById('authToggleText');
    const authToggleLink = document.getElementById('authToggleLink');
    
    if (isSignUp) {
        authButton.textContent = 'Sign Up';
        authToggleText.textContent = 'Already have an account?';
        authToggleLink.textContent = 'Sign In';
    } else {
        authButton.textContent = 'Sign In';
        authToggleText.textContent = "Don't have an account?";
        authToggleLink.textContent = 'Sign Up';
    }
    
    hideAuthError();
}

async function handleAuth() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const authButton = document.getElementById('authButton');
    
    if (!email || !password) {
        showAuthError('Please enter both email and password');
        return;
    }

    authButton.disabled = true;
    authButton.textContent = 'Loading...';
    hideAuthError();

    try {
        if (isSignUp) {
            await auth.createUserWithEmailAndPassword(email, password);
        } else {
            await auth.signInWithEmailAndPassword(email, password);
        }
    } catch (error) {
        console.error('Auth error:', error);
        showAuthError(getAuthErrorMessage(error.code));
        authButton.disabled = false;
        authButton.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    }
}

function showAuthError(message) {
    const errorDiv = document.getElementById('authError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function hideAuthError() {
    const errorDiv = document.getElementById('authError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
            return 'No account found with this email address';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters';
        case 'auth/invalid-email':
            return 'Please enter a valid email address';
        case 'auth/invalid-credential':
            return 'Invalid email or password';
        default:
            return 'An error occurred. Please try again.';
    }
}

// Firestore Functions
async function loadUserNotes() {
    if (!currentUser) return;
    
    try {
        const snapshot = await db.collection('users')
            .doc(currentUser.uid)
            .collection('notes')
            .orderBy('dateModified', 'desc')
            .get();
        
        notes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderNotesList();
        showDashboard();
    } catch (error) {
        console.error('Error loading notes:', error);
        // If there's an error, just show empty dashboard
        notes = [];
        renderNotesList();
        showDashboard();
    }
}

async function saveNoteToFirestore(note) {
    if (!currentUser) return;
    
    try {
        await db.collection('users')
            .doc(currentUser.uid)
            .collection('notes')
            .doc(note.id)
            .set(note);
    } catch (error) {
        console.error('Error saving note:', error);
    }
}

async function deleteNoteFromFirestore(noteId) {
    if (!currentUser) return;
    
    try {
        await db.collection('users')
            .doc(currentUser.uid)
            .collection('notes')
            .doc(noteId)
            .delete();
    } catch (error) {
        console.error('Error deleting note:', error);
    }
}

// Note Management Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(date) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function createNewNote() {
    const newNote = {
        id: generateId(),
        title: 'Untitled Note',
        content: '',
        type: 'note',
        dateModified: new Date().toISOString(),
        todos: []
    };
    
    notes.unshift(newNote);
    await saveNoteToFirestore(newNote);
    renderNotesList();
    selectNote(newNote.id);
}

async function createNewTodo() {
    const newTodo = {
        id: generateId(),
        title: 'New To-Do List',
        content: '',
        type: 'todo',
        dateModified: new Date().toISOString(),
        todos: []
    };
    
    notes.unshift(newTodo);
    await saveNoteToFirestore(newTodo);
    renderNotesList();
    selectNote(newTodo.id);
}

function renderNotesList() {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;
    
    notesList.innerHTML = '';

    notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = `note-item ${currentNoteId === note.id ? 'active' : ''}`;
        noteItem.onclick = () => selectNote(note.id);
        
        noteItem.innerHTML = `
            <div class="note-title">${note.title || 'Untitled'}</div>
            <div class="note-date">${formatDate(note.dateModified)}</div>
            <div class="note-type">${note.type === 'todo' ? '✓ To-Do' : '📝 Note'}</div>
        `;
        
        notesList.appendChild(noteItem);
    });
}

function selectNote(noteId) {
    if (currentNoteId) {
        saveCurrentNote();
    }
    
    currentNoteId = noteId;
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    renderNotesList();
    renderNoteEditor(note);
    
    const exportBtn = document.getElementById('exportCurrentBtn');
    if (exportBtn) {
        exportBtn.style.display = 'block';
    }
    
    if (window.innerWidth <= 768) {
        closeSidebar();
    }
}

function showDashboard() {
    currentNoteId = null;
    renderNotesList();
    
    const exportBtn = document.getElementById('exportCurrentBtn');
    if (exportBtn) {
        exportBtn.style.display = 'none';
    }
    
    const totalNotes = notes.filter(n => n.type === 'note').length;
    const totalTodos = notes.filter(n => n.type === 'todo').length;
    const completedTasks = notes
        .filter(n => n.type === 'todo')
        .reduce((total, note) => total + (note.todos?.filter(todo => todo.completed).length || 0), 0);
    const totalTasks = notes
        .filter(n => n.type === 'todo')
        .reduce((total, note) => total + (note.todos?.length || 0), 0);
    
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-header">
                <h1>Welcome to Sweetener Notes! ✨</h1>
                <p>Your personal productivity space</p>
            </div>
            
            ${notes.length > 0 ? `
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-number">${totalNotes}</div>
                    <div class="stat-label">📝 Notes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalTodos}</div>
                    <div class="stat-label">✓ To-Do Lists</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${completedTasks}/${totalTasks}</div>
                    <div class="stat-label">🎯 Tasks Done</div>
                </div>
            </div>
            
            <div class="dashboard-actions">
                <h3>Quick Actions</h3>
                <div class="action-buttons">
                    <button class="action-btn primary" onclick="createNewNote()">
                        📝 Create Note
                    </button>
                    <button class="action-btn secondary" onclick="createNewTodo()">
                        ✓ Create To-Do
                    </button>
                </div>
            </div>
            ` : `
            <div class="empty-dashboard">
                <div class="empty-icon">📋</div>
                <h2>Ready to get organized?</h2>
                <p>Create your first note or to-do list to get started!</p>
                <div class="action-buttons">
                    <button class="action-btn primary" onclick="createNewNote()">
                        📝 Create Your First Note
                    </button>
                    <button class="action-btn secondary" onclick="createNewTodo()">
                        ✓ Create Your First To-Do
                    </button>
                </div>
            </div>
            `}
        </div>
    `;
}

function renderNoteEditor(note) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    if (note.type === 'todo') {
        mainContent.innerHTML = `
            <div class="editor-header">
                <div class="editor-header-top">
                    <button class="close-editor-btn" onclick="showDashboard()" title="Back to Dashboard">← Dashboard</button>
                    <div class="header-controls">
                        <select class="type-select" onchange="changeNoteType(this.value)">
                            <option value="note" ${note.type === 'note' ? 'selected' : ''}>📝 Note</option>
                            <option value="todo" ${note.type === 'todo' ? 'selected' : ''}>✓ To-Do</option>
                        </select>
                        <button class="delete-btn" onclick="deleteCurrentNote()">Delete</button>
                    </div>
                </div>
                <input type="text" class="title-input" value="${note.title}" 
                       onchange="updateNoteTitle(this.value)" placeholder="Enter title...">
            </div>
            
            <div class="editor-container">
                <div class="todo-list" id="todoList"></div>
                <button class="add-todo" onclick="addTodoItem()">+ Add Task</button>
            </div>
        `;
        renderTodoList(note);
    } else {
        mainContent.innerHTML = `
            <div class="editor-header">
                <div class="editor-header-top">
                    <button class="close-editor-btn" onclick="showDashboard()" title="Back to Dashboard">← Dashboard</button>
                    <div class="header-controls">
                        <select class="type-select" onchange="changeNoteType(this.value)">
                            <option value="note" ${note.type === 'note' ? 'selected' : ''}>📝 Note</option>
                            <option value="todo" ${note.type === 'todo' ? 'selected' : ''}>✓ To-Do</option>
                        </select>
                        <button class="delete-btn" onclick="deleteCurrentNote()">Delete</button>
                    </div>
                </div>
                <input type="text" class="title-input" value="${note.title}" 
                       onchange="updateNoteTitle(this.value)" placeholder="Enter title...">
            </div>
            
            <div class="editor-container">
                <textarea class="content-area" placeholder="Start writing your note..."
                          onchange="updateNoteContent(this.value)">${note.content}</textarea>
            </div>
        `;
    }
}

function renderTodoList(note) {
    const todoList = document.getElementById('todoList');
    if (!todoList) return;
    
    todoList.innerHTML = '';

    note.todos.forEach((todo, index) => {
        const todoItem = document.createElement('div');
        todoItem.className = 'todo-item';
        todoItem.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo(${index})">
            <input type="text" class="todo-text ${todo.completed ? 'todo-completed' : ''}" 
                   value="${todo.text}" onchange="updateTodoText(${index}, this.value)"
                   placeholder="Enter task...">
            <button class="todo-delete" onclick="deleteTodo(${index})">×</button>
        `;
        todoList.appendChild(todoItem);
    });
}

async function addTodoItem() {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    note.todos.push({ text: '', completed: false });
    note.dateModified = new Date().toISOString();
    await saveNoteToFirestore(note);
    renderTodoList(note);
    renderNotesList();
}

async function toggleTodo(index) {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    note.todos[index].completed = !note.todos[index].completed;
    note.dateModified = new Date().toISOString();
    await saveNoteToFirestore(note);
    renderTodoList(note);
    renderNotesList();
}

async function updateTodoText(index, text) {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    note.todos[index].text = text;
    note.dateModified = new Date().toISOString();
    await saveNoteToFirestore(note);
    renderNotesList();
}

async function deleteTodo(index) {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    note.todos.splice(index, 1);
    note.dateModified = new Date().toISOString();
    await saveNoteToFirestore(note);
    renderTodoList(note);
    renderNotesList();
}

async function updateNoteTitle(title) {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    note.title = title;
    note.dateModified = new Date().toISOString();
    await saveNoteToFirestore(note);
    renderNotesList();
}

async function updateNoteContent(content) {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    note.content = content;
    note.dateModified = new Date().toISOString();
    await saveNoteToFirestore(note);
    renderNotesList();
}

async function changeNoteType(type) {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    note.type = type;
    note.dateModified = new Date().toISOString();
    await saveNoteToFirestore(note);
    renderNoteEditor(note);
    renderNotesList();
}

async function deleteCurrentNote() {
    if (!currentNoteId) return;
    
    const noteToDelete = notes.find(n => n.id === currentNoteId);
    if (!noteToDelete) return;
    
    if (confirm(`Are you sure you want to delete "${noteToDelete.title}"?`)) {
        notes = notes.filter(n => n.id !== currentNoteId);
        await deleteNoteFromFirestore(currentNoteId);
        showDashboard();
    }
}

function saveCurrentNote() {
    // Auto-save is handled by individual update functions
}

// Export functions
function formatNoteForExport(note) {
    let content = '';
    
    content += `# ${note.title}\n\n`;
    content += `**Type:** ${note.type === 'todo' ? 'To-Do List' : 'Note'}  \n`;
    content += `**Last Modified:** ${formatDate(note.dateModified)}  \n\n`;
    
    if (note.type === 'todo') {
        if (note.todos && note.todos.length > 0) {
            content += '## Tasks\n\n';
            note.todos.forEach(todo => {
                const checkbox = todo.completed ? '[x]' : '[ ]';
                content += `- ${checkbox} ${todo.text || 'Untitled task'}\n`;
            });
        } else {
            content += '*No tasks added yet*\n';
        }
        
        if (note.content && note.content.trim()) {
            content += '\n## Additional Notes\n\n';
            content += note.content;
        }
    } else {
        if (note.content && note.content.trim()) {
            content += note.content;
        } else {
            content += '*No content added yet*';
        }
    }
    
    return content + '\n\n---\n\n';
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportAllNotes() {
    if (notes.length === 0) {
        alert('No notes to export! Create some notes first.');
        return;
    }
    
    let content = `# My Notes & Tasks Backup\n\n`;
    content += `Exported on: ${new Date().toLocaleString()}\n`;
    content += `Total items: ${notes.length}\n\n`;
    content += `---\n\n`;
    
    const sortedNotes = [...notes].sort((a, b) => new Date(b.dateModified) - new Date(a.dateModified));
    
    sortedNotes.forEach(note => {
        content += formatNoteForExport(note);
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(content, `notes-backup-${timestamp}.md`);
}

function exportCurrentNote() {
    if (!currentNoteId) {
        alert('No note selected to export!');
        return;
    }
    
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) {
        alert('Selected note not found!');
        return;
    }
    
    const content = formatNoteForExport(note);
    const safeTitle = note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(content, `${safeTitle}-${timestamp}.md`);
}

// Mobile navigation functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const body = document.body;
    
    if (sidebar && body) {
        sidebar.classList.toggle('sidebar-open');
        body.classList.toggle('sidebar-overlay');
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const body = document.body;
    
    if (sidebar && body) {
        sidebar.classList.remove('sidebar-open');
        body.classList.remove('sidebar-overlay');
    }
}

function setupMobileNavigation() {
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        if (window.innerWidth <= 768 && 
            sidebar && sidebar.classList.contains('sidebar-open') && 
            !sidebar.contains(e.target) && 
            mobileMenuBtn && !mobileMenuBtn.contains(e.target)) {
            closeSidebar();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const sidebar = document.getElementById('sidebar');
        const body = document.body;
        
        if (window.innerWidth > 768 && sidebar && body) {
            sidebar.classList.remove('sidebar-open');
            body.classList.remove('sidebar-overlay');
        }
    });
}
