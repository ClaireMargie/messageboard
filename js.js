// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('messageForm');
    const messagesList = document.getElementById('messagesList');

    // Enhanced CRUD Operations
    class MessageBoard {
        constructor() {
            this.messages = this.loadFromStorage();
            this.loadMessages();
            this.setupEventListeners();
        }

        // CREATE - Add new message
        createMessage(name, email, message) {
            if (!name || !email || !message) {
                this.showNotification('Please fill in all fields', 'error');
                return false;
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showNotification('Please enter a valid email address', 'error');
                return false;
            }

            const newMessage = {
                id: Date.now(),
                name: name.trim(),
                email: email.trim(),
                message: message.trim(),
                timestamp: new Date().toISOString(),
                editing: false
            };

            this.messages.push(newMessage);
            this.saveToStorage();
            this.loadMessages();
            this.showNotification('Message added successfully!', 'success');
            return true;
        }

        // READ - Display all messages
        loadMessages() {
            if (!messagesList) return;
            
            messagesList.innerHTML = '';
            
            if (this.messages.length === 0) {
                messagesList.innerHTML = '<li class="no-messages">No messages yet. Be the first to leave a message!</li>';
                return;
            }

            this.messages.forEach((msg, idx) => {
                const li = document.createElement('li');
                li.className = 'message-item';
                li.setAttribute('data-index', idx);
                
                if (msg.editing) {
                    li.innerHTML = this.getEditFormHTML(msg, idx);
                } else {
                    li.innerHTML = this.getMessageHTML(msg, idx);
                }
                
                messagesList.appendChild(li);
            });
        }

        // UPDATE - Edit existing message
        updateMessage(idx, name, email, message) {
            if (!name || !email || !message) {
                this.showNotification('Please fill in all fields', 'error');
                return false;
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showNotification('Please enter a valid email address', 'error');
                return false;
            }

            this.messages[idx] = {
                ...this.messages[idx],
                name: name.trim(),
                email: email.trim(),
                message: message.trim(),
                timestamp: new Date().toISOString(),
                editing: false
            };

            this.saveToStorage();
            this.loadMessages();
            this.showNotification('Message updated successfully!', 'success');
            return true;
        }

        // DELETE - Remove message
        deleteMessage(idx) {
            if (confirm('Are you sure you want to delete this message?')) {
                this.messages.splice(idx, 1);
                this.saveToStorage();
                this.loadMessages();
                this.showNotification('Message deleted successfully!', 'success');
            }
        }

        // Helper methods
        loadFromStorage() {
            try {
                const stored = localStorage.getItem('messages');
                if (!stored) return [];
                
                const messages = JSON.parse(stored);
                
                // Migrate old messages without timestamps
                return messages.map(msg => ({
                    ...msg,
                    timestamp: msg.timestamp || new Date().toISOString(),
                    id: msg.id || Date.now() + Math.random()
                }));
            } catch (error) {
                console.error('Error loading messages:', error);
                return [];
            }
        }

        saveToStorage() {
            try {
                localStorage.setItem('messages', JSON.stringify(this.messages));
            } catch (error) {
                console.error('Error saving messages:', error);
                this.showNotification('Error saving message', 'error');
            }
        }

        getMessageHTML(msg, idx) {
            let date;
            try {
                const d = new Date(msg.timestamp);
                date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
                    ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            } catch (error) {
                date = 'Unknown date';
            }
            return `
                <div class='message-header'>
                    <span class="message-name">${this.escapeHtml(msg.name)}</span>
                    <span class="message-email">(${this.escapeHtml(msg.email)})</span>
                </div>
                <div class='message-body'>${this.escapeHtml(msg.message)}</div>
                <div class='message-footer'>
                    <span class="message-date">${date}</span>
                    <div class='message-actions'>
                        <button class="btn-edit" data-action="edit" data-index="${idx}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" data-action="delete" data-index="${idx}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }

        getEditFormHTML(msg, idx) {
            return `
                <div class="edit-form">
                    <input class='edit-input' type='text' value='${this.escapeHtml(msg.name)}' id='edit-name-${idx}' placeholder='Name' required>
                    <input class='edit-input' type='email' value='${this.escapeHtml(msg.email)}' id='edit-email-${idx}' placeholder='Email' required>
                    <textarea class='edit-input' id='edit-message-${idx}' placeholder='Message' required>${this.escapeHtml(msg.message)}</textarea>
                    <div class='edit-actions'>
                        <button class="btn-save" data-action="save" data-index="${idx}">
                            <i class="fas fa-save"></i> Save
                        </button>
                        <button class="btn-cancel" data-action="cancel" data-index="${idx}">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            `;
        }

        escapeHtml(text) {
            if (typeof text !== 'string') return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        showNotification(message, type = 'info') {
            // Remove existing notifications
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(notification => {
                document.body.removeChild(notification);
            });

            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }

        // Event handlers
        editMessage(idx) {
            this.messages[idx].editing = true;
            this.saveToStorage();
            this.loadMessages();
        }

        saveEdit(idx) {
            const nameInput = document.getElementById('edit-name-' + idx);
            const emailInput = document.getElementById('edit-email-' + idx);
            const messageInput = document.getElementById('edit-message-' + idx);
            
            if (!nameInput || !emailInput || !messageInput) {
                this.showNotification('Error: Form elements not found', 'error');
                return;
            }
            
            const name = nameInput.value;
            const email = emailInput.value;
            const message = messageInput.value;
            this.updateMessage(idx, name, email, message);
        }

        cancelEdit(idx) {
            this.messages[idx].editing = false;
            this.saveToStorage();
            this.loadMessages();
        }

        handleButtonClick(event) {
            const button = event.target.closest('button');
            if (!button) return;

            const action = button.getAttribute('data-action');
            const index = parseInt(button.getAttribute('data-index'));

            if (isNaN(index)) return;

            switch (action) {
                case 'edit':
                    this.editMessage(index);
                    break;
                case 'delete':
                    this.deleteMessage(index);
                    break;
                case 'save':
                    this.saveEdit(index);
                    break;
                case 'cancel':
                    this.cancelEdit(index);
                    break;
            }
        }

        setupEventListeners() {
            if (!form) {
                console.error('Message form not found');
                return;
            }
            
            // Form submission
            form.onsubmit = (e) => {
                e.preventDefault();
                const name = form.name.value;
                const email = form.email.value;
                const message = form.message.value;
                
                if (this.createMessage(name, email, message)) {
                    form.reset();
                }
            };

            // Event delegation for buttons
            if (messagesList) {
                messagesList.addEventListener('click', (e) => {
                    this.handleButtonClick(e);
                });
            }
        }
    }

    // Initialize the message board
    window.messageBoard = new MessageBoard();
}); 