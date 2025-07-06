class SlackConnect {
    constructor() {
        this.userId = localStorage.getItem('userId') || '';
        this.isConnected = false;
        this.init();
    }

    async init() {
        if (this.userId) {
            document.getElementById('userId').value = this.userId;
            await this.checkConnection();
        }
    }

    async checkConnection() {
        try {
            const response = await fetch('/api/messages/channels', {
                headers: { 'user-id': this.userId }
            });

            if (response.ok) {
                this.isConnected = true;
                this.showConnectedState();
                await this.loadChannels();
                await this.loadScheduledMessages();
            }
        } catch (error) {
            console.error('Connection check failed:', error);
        }
    }

    showConnectedState() {
        document.getElementById('messageSection').classList.remove('hidden');
        document.getElementById('scheduledSection').classList.remove('hidden');
        this.showStatus('Connected to Slack!', 'success');
    }

    showStatus(message, type = 'success') {
        const statusDiv = document.getElementById('status');
        statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
        setTimeout(() => statusDiv.innerHTML = '', 5000);
    }

    async connectSlack() {
        const userId = document.getElementById('userId').value.trim();
        
        if (!userId) {
            this.showStatus('Please enter a User ID', 'error');
            return;
        }

        this.userId = userId;
        localStorage.setItem('userId', userId);

        try {
            const response = await fetch('/api/auth/slack/connect');
            const data = await response.json();
            
            if (data.authUrl) {
                window.open(data.authUrl, 'slack-auth', 'width=600,height=600');
                
                // Listen for auth completion
                window.addEventListener('message', async (event) => {
                    if (event.data.type === 'slack-auth-success') {
                        await this.handleAuthCallback(event.data.code);
                    }
                });
            }
        } catch (error) {
            this.showStatus('Failed to initiate Slack connection', 'error');
        }
    }

    async handleAuthCallback(code) {
        try {
            const response = await fetch('/api/auth/slack/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, userId: this.userId })
            });

            const data = await response.json();
            
            if (data.success) {
                this.isConnected = true;
                this.showConnectedState();
                await this.loadChannels();
            } else {
                this.showStatus('Failed to connect to Slack', 'error');
            }
        } catch (error) {
            this.showStatus('Failed to complete Slack connection', 'error');
        }
    }

    async loadChannels() {
        try {
            const response = await fetch('/api/messages/channels', {
                headers: { 'user-id': this.userId }
            });

            if (response.ok) {
                const channels = await response.json();
                const select = document.getElementById('channelSelect');
                select.innerHTML = '<option value="">Select a channel...</option>';
                
                channels.forEach(channel => {
                    const option = document.createElement('option');
                    option.value = channel.id;
                    option.textContent = `#${channel.name}`;
                    option.dataset.name = channel.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            this.showStatus('Failed to load channels', 'error');
        }
    }

    async sendMessage() {
        const channelId = document.getElementById('channelSelect').value;
        const message = document.getElementById('messageText').value.trim();

        if (!channelId || !message) {
            this.showStatus('Please select a channel and enter a message', 'error');
            return;
        }

        try {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': this.userId
                },
                body: JSON.stringify({ channelId, message })
            });

            if (response.ok) {
                this.showStatus('Message sent successfully!', 'success');
                document.getElementById('messageText').value = '';
            } else {
                this.showStatus('Failed to send message', 'error');
            }
        } catch (error) {
            this.showStatus('Failed to send message', 'error');
        }
    }

    async scheduleMessage() {
        const channelId = document.getElementById('channelSelect').value;
        const channelName = document.getElementById('channelSelect').selectedOptions[0]?.dataset.name;
        const message = document.getElementById('messageText').value.trim();
        const scheduleTime = document.getElementById('scheduleTime').value;

        if (!channelId || !message || !scheduleTime) {
            this.showStatus('Please select a channel, enter a message, and set a schedule time', 'error');
            return;
        }

        try {
            const response = await fetch('/api/messages/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': this.userId
                },
                body: JSON.stringify({ 
                    channelId, 
                    channelName,
                    message, 
                    scheduledTime: scheduleTime 
                })
            });

            if (response.ok) {
                this.showStatus('Message scheduled successfully!', 'success');
                document.getElementById('messageText').value = '';
                document.getElementById('scheduleTime').value = '';
                await this.loadScheduledMessages();
            } else {
                const error = await response.json();
                this.showStatus(error.error || 'Failed to schedule message', 'error');
            }
        } catch (error) {
            this.showStatus('Failed to schedule message', 'error');
        }
    }

    async loadScheduledMessages() {
        try {
            const response = await fetch('/api/messages/scheduled', {
                headers: { 'user-id': this.userId }
            });

            if (response.ok) {
                const messages = await response.json();
                this.displayScheduledMessages(messages);
            }
        } catch (error) {
            console.error('Failed to load scheduled messages:', error);
        }
    }

    displayScheduledMessages(messages) {
        const container = document.getElementById('scheduledMessages');
        
        if (messages.length === 0) {
            container.innerHTML = '<p>No scheduled messages</p>';
            return;
        }

        container.innerHTML = messages.map(msg => `
            <div class="message-item">
                <strong>#${msg.channelName}</strong><br>
                <em>Scheduled for: ${new Date(msg.scheduledTime).toLocaleString()}</em><br>
                <p>${msg.message}</p>
                <button class="danger" onclick="app.cancelMessage(${msg.id})">Cancel</button>
            </div>
        `).join('');
    }

    async cancelMessage(messageId) {
        try {
            const response = await fetch(`/api/messages/scheduled/${messageId}`, {
                method: 'DELETE',
                headers: { 'user-id': this.userId }
            });

            if (response.ok) {
                this.showStatus('Message cancelled successfully!', 'success');
                await this.loadScheduledMessages();
            } else {
                this.showStatus('Failed to cancel message', 'error');
            }
        } catch (error) {
            this.showStatus('Failed to cancel message', 'error');
        }
    }
}

// Initialize app
const app = new SlackConnect();

// Global functions for HTML onclick handlers
function connectSlack() { app.connectSlack(); }
function sendMessage() { app.sendMessage(); }
function scheduleMessage() { app.scheduleMessage(); }
function loadScheduledMessages() { app.loadScheduledMessages(); }
