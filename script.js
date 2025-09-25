let notes = JSON.parse(localStorage.getItem('notesTodo') || '[]');
        let currentNoteId = null;

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

        function saveNotes() {
            localStorage.setItem('notesTodo', JSON.stringify(notes));
        }

        function createNewNote() {
            const newNote = {
                id: generateId(),
                title: 'Untitled Note',
                content: '',
                type: 'note',
                dateModified: new Date().toISOString(),
                todos: []
            };
            
            notes.unshift(newNote);
            saveNotes();
            renderNotesList();
            selectNote(newNote.id);
        }

        function createNewTodo() {
            const newTodo = {
                id: generateId(),
                title: 'New To-Do List',
                content: '',
                type: 'todo',
                dateModified: new Date().toISOString(),
                todos: []
            };
            
            notes.unshift(newTodo);
            saveNotes();
            renderNotesList();
            selectNote(newTodo.id);
        }

        function renderNotesList() {
            const notesList = document.getElementById('notesList');
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
            
            // Show/hide export current button
            const exportBtn = document.getElementById('exportCurrentBtn');
            if (exportBtn) {
                exportBtn.style.display = 'block';
            }
        }

        function formatNoteForExport(note) {
            let content = '';
            
            // Add title
            content += `# ${note.title}\n\n`;
            
            // Add metadata
            content += `**Type:** ${note.type === 'todo' ? 'To-Do List' : 'Note'}  \n`;
            content += `**Last Modified:** ${formatDate(note.dateModified)}  \n\n`;
            
            // Add content based on type
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
            
            // Sort notes by date (newest first)
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

        function renderNoteEditor(note) {
            const mainContent = document.getElementById('mainContent');
            
            if (note.type === 'todo') {
                mainContent.innerHTML = `
                    <div class="editor-header">
                        <input type="text" class="title-input" value="${note.title}" 
                               onchange="updateNoteTitle(this.value)" placeholder="Enter title...">
                        <div class="header-controls">
                            <select class="type-select" onchange="changeNoteType(this.value)">
                                <option value="note" ${note.type === 'note' ? 'selected' : ''}>📝 Note</option>
                                <option value="todo" ${note.type === 'todo' ? 'selected' : ''}>✓ To-Do</option>
                            </select>
                            <button class="delete-btn" onclick="deleteCurrentNote()">Delete</button>
                        </div>
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
                        <input type="text" class="title-input" value="${note.title}" 
                               onchange="updateNoteTitle(this.value)" placeholder="Enter title...">
                        <div class="header-controls">
                            <select class="type-select" onchange="changeNoteType(this.value)">
                                <option value="note" ${note.type === 'note' ? 'selected' : ''}>📝 Note</option>
                                <option value="todo" ${note.type === 'todo' ? 'selected' : ''}>✓ To-Do</option>
                            </select>
                            <button class="delete-btn" onclick="deleteCurrentNote()">Delete</button>
                        </div>
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

        function addTodoItem() {
            const note = notes.find(n => n.id === currentNoteId);
            if (!note) return;

            note.todos.push({ text: '', completed: false });
            note.dateModified = new Date().toISOString();
            saveNotes();
            renderTodoList(note);
            renderNotesList();
        }

        function toggleTodo(index) {
            const note = notes.find(n => n.id === currentNoteId);
            if (!note) return;

            note.todos[index].completed = !note.todos[index].completed;
            note.dateModified = new Date().toISOString();
            saveNotes();
            renderTodoList(note);
            renderNotesList();
        }

        function updateTodoText(index, text) {
            const note = notes.find(n => n.id === currentNoteId);
            if (!note) return;

            note.todos[index].text = text;
            note.dateModified = new Date().toISOString();
            saveNotes();
            renderNotesList();
        }

        function deleteTodo(index) {
            const note = notes.find(n => n.id === currentNoteId);
            if (!note) return;

            note.todos.splice(index, 1);
            note.dateModified = new Date().toISOString();
            saveNotes();
            renderTodoList(note);
            renderNotesList();
        }

        function updateNoteTitle(title) {
            const note = notes.find(n => n.id === currentNoteId);
            if (!note) return;

            note.title = title;
            note.dateModified = new Date().toISOString();
            saveNotes();
            renderNotesList();
        }

        function updateNoteContent(content) {
            const note = notes.find(n => n.id === currentNoteId);
            if (!note) return;

            note.content = content;
            note.dateModified = new Date().toISOString();
            saveNotes();
            renderNotesList();
        }

        function changeNoteType(type) {
            const note = notes.find(n => n.id === currentNoteId);
            if (!note) return;

            note.type = type;
            note.dateModified = new Date().toISOString();
            saveNotes();
            renderNoteEditor(note);
            renderNotesList();
        }

        function deleteCurrentNote() {
            if (!currentNoteId) {
                console.log('No current note selected');
                return;
            }
            
            const noteToDelete = notes.find(n => n.id === currentNoteId);
            if (!noteToDelete) {
                console.log('Note not found');
                return;
            }
            
            if (confirm(`Are you sure you want to delete "${noteToDelete.title}"?`)) {
                // Filter out the current note
                notes = notes.filter(n => n.id !== currentNoteId);
                saveNotes();
                
                // Clear current selection
                currentNoteId = null;
                
                // Update the UI
                renderNotesList();
                
                // Show empty state or select another note
                if (notes.length > 0) {
                    // Auto-select the first remaining note
                    selectNote(notes[0].id);
                } else {
                    // Show empty state
                    document.getElementById('mainContent').innerHTML = `
                        <div class="empty-state">
                            <h2>Note deleted! 🗑️</h2>
                            <p>Create a new note or select an existing one</p>
                        </div>
                    `;
                }
            }
        }

        function saveCurrentNote() {
            // This function is called when switching between notes to ensure current changes are saved
            // The individual update functions already handle saving, so this is mainly for safety
        }

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            renderNotesList();
            
            if (notes.length > 0) {
                selectNote(notes[0].id);
            }
        });

        // Auto-save functionality
        setInterval(() => {
            if (currentNoteId) {
                const note = notes.find(n => n.id === currentNoteId);
                if (note) {
                    saveNotes();
                }
            }

                function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const body = document.body;
            
            sidebar.classList.toggle('sidebar-open');
            body.classList.toggle('sidebar-overlay');
        }

        function closeSidebar() {
            const sidebar = document.getElementById('sidebar');
            const body = document.body;
            
            sidebar.classList.remove('sidebar-open');
            body.classList.remove('sidebar-overlay');
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
            
            // Show/hide export current button
            const exportBtn = document.getElementById('exportCurrentBtn');
            if (exportBtn) {
                exportBtn.style.display = 'block';
            }
            
            // Close sidebar on mobile after selecting a note
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        }
        }, 5000); // Auto-save every 5 seconds
