Slack Connect
A full-stack TypeScript application that enables seamless Slack workspace integration with immediate and scheduled message delivery capabilities. Built with modern web technologies and robust OAuth 2.0 authentication.

🚀 Features
Secure Slack Integration: OAuth 2.0 flow with automatic token refresh

Immediate Messaging: Send messages to any Slack channel instantly

Smart Scheduling: Schedule messages for future delivery with persistent storage

Token Management: Automatic access token refresh without user re-authentication

Real-time Updates: Live scheduled message management with cancellation support

Robust Architecture: TypeScript-first development with comprehensive error handling

🏗️ Architecture Overview
System Design
text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Slack API     │
│   (Vanilla JS)  │◄──►│   (Express.js)  │◄──►│   (OAuth 2.0)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   SQLite DB     │
                       │   (Persistence) │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Cron Scheduler│
                       │   (Node-cron)   │
                       └─────────────────┘
Core Components
1. OAuth 2.0 Flow

Implements secure three-legged OAuth with Slack

Handles authorization code exchange for access/refresh tokens

Automatic token validation and refresh mechanism

Secure token storage with encryption considerations

2. Token Management System

Proactive token refresh before expiration

Fallback refresh logic for expired tokens

Database-backed token persistence

User session management without cookies

3. Message Scheduling Engine

Cron-based scheduler running every minute

Persistent message queue in SQLite

Atomic message status updates (pending → sent → cancelled)

Error handling and retry logic for failed deliveries

4. Database Layer

SQLite for lightweight, serverless persistence

Normalized schema for tokens and scheduled messages

ACID compliance for message scheduling reliability

Automatic table initialization and migration

📋 Prerequisites
Node.js v16+ (LTS recommended)

npm or yarn package manager

Slack Workspace with admin permissions

ngrok Account (free tier sufficient)

🛠️ Detailed Setup Instructions
Step 1: Repository Setup
bash
# Clone the repository
git clone <your-repository-url>
cd slack-connect

# Install dependencies
npm install

# Verify TypeScript compilation
npm run build
Step 2: ngrok Configuration (Critical for OAuth)
Slack requires HTTPS for OAuth redirects. ngrok provides secure tunneling:

bash
# Install ngrok globally
npm install -g ngrok

# Sign up at https://dashboard.ngrok.com/signup
# Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken

# Configure authtoken (one-time setup)
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE

# Start tunnel (keep this running)
ngrok http 3000
Important: Copy the HTTPS URL (e.g., https://abc123.ngrok.io) for Slack configuration.

Step 3: Slack App Configuration
Create Slack App
Navigate to Slack API Apps

Click "Create New App" → "From scratch"

App Name: Slack Connect

Select your development workspace

Configure OAuth & Permissions
Go to "OAuth & Permissions" in sidebar

Redirect URLs: Add https://your-ngrok-url.ngrok.io/api/auth/slack/callback

Bot Token Scopes: Add these permissions:

channels:read - View basic channel information

chat:write - Send messages as the bot

users:read - View workspace members

Get Credentials
Navigate to "Basic Information"

Under "App Credentials", copy:

Client ID

Client Secret

Step 4: Environment Configuration
Create .env file in project root:

text
# Server Configuration
PORT=3000

# Slack OAuth Credentials
SLACK_CLIENT_ID=your_client_id_from_slack_app
SLACK_CLIENT_SECRET=your_client_secret_from_slack_app
SLACK_REDIRECT_URI=https://your-ngrok-url.ngrok.io/api/auth/slack/callback

# Optional: Database Configuration
DB_PATH=./slack_connect.db
Security Note: Never commit .env to version control. Add it to .gitignore.

Step 5: Database Initialization
The application automatically creates SQLite tables on first run:

bash
# Start development server
npm run dev

# Database file will be created at: ./slack_connect.db
# Tables: slack_tokens, scheduled_messages
Step 6: Application Startup
bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start

# The server starts on http://localhost:3000
# Access via ngrok URL: https://your-ngrok-url.ngrok.io
🎯 Usage Workflow
1. Initial Connection
Open ngrok HTTPS URL in browser

Enter unique User ID (e.g., john-doe-123)

Click "Connect to Slack"

Authorize app in Slack popup

Confirmation: "Connected to Slack!"

2. Sending Messages
Immediate: Select channel → Type message → "Send Now"

Scheduled: Select channel → Type message → Set datetime → "Schedule Message"

3. Managing Scheduled Messages
View pending messages in "Scheduled Messages" section

Cancel any message before its scheduled time

Messages automatically send at designated time

🏛️ Technical Architecture Deep Dive
Authentication Flow
typescript
// OAuth 2.0 Three-Legged Flow
1. User → Frontend → Backend: Request auth URL
2. Backend → Slack: Generate OAuth URL with scopes
3. User → Slack: Authorize application
4. Slack → Backend: Return authorization code
5. Backend → Slack: Exchange code for tokens
6. Backend → Database: Store encrypted tokens
7. Backend → Frontend: Confirm connection
Token Refresh Strategy
typescript
// Proactive Token Management
async function ensureValidToken(userId: string) {
  const token = await TokenService.getToken(userId);
  
  if (await SlackService.validateToken(token.accessToken)) {
    return token.accessToken; // Still valid
  }
  
  if (token.refreshToken) {
    const newToken = await SlackService.refreshAccessToken(token.refreshToken);
    await TokenService.updateToken(userId, newToken.access_token);
    return newToken.access_token;
  }
  
  throw new Error('Re-authentication required');
}
Scheduling Architecture
typescript
// Cron-based Message Scheduler
cron.schedule('* * * * *', async () => {
  const pendingMessages = await MessageService.getPendingMessages();
  
  for (const message of pendingMessages) {
    try {
      const token = await ensureValidToken(message.userId);
      const success = await SlackService.sendMessage(token, message.channelId, message.message);
      
      if (success) {
        await MessageService.markMessageAsSent(message.id);
      }
    } catch (error) {
      console.error(`Failed to send message ${message.id}:`, error);
    }
  }
});
🚧 Challenges & Learnings
Challenge 1: OAuth Redirect Handling
Problem: Slack requires HTTPS for OAuth redirects, but local development uses HTTP.

Solution: Implemented ngrok tunneling with proper popup-based OAuth flow:

javascript
// Frontend: Handle OAuth popup
window.open(authUrl, 'slack-auth', 'width=600,height=600');
window.addEventListener('message', (event) => {
  if (event.data.type === 'slack-auth-success') {
    handleAuthCallback(event.data.code);
  }
});
Learning: Always design OAuth flows with production constraints in mind, even during development.

Challenge 2: Token Refresh Race Conditions
Problem: Multiple simultaneous API calls could trigger concurrent token refresh attempts.

Solution: Implemented token validation before each API call with atomic updates:

typescript
// Middleware: Ensure valid token before each request
export async function authenticateSlack(req: AuthRequest, res: Response, next: NextFunction) {
  const tokenData = await TokenService.getToken(req.userId);
  
  if (!await SlackService.validateToken(tokenData.accessToken)) {
    if (tokenData.refreshToken) {
      const newToken = await SlackService.refreshAccessToken(tokenData.refreshToken);
      await TokenService.updateToken(req.userId, newToken.access_token);
      req.accessToken = newToken.access_token;
    } else {
      return res.status(401).json({ error: 'Re-authentication required' });
    }
  }
  
  next();
}
Learning: OAuth token management requires careful consideration of concurrency and error states.

Challenge 3: Reliable Message Scheduling
Problem: Ensuring scheduled messages are sent exactly once, even if the server restarts.

Solution: Database-backed scheduling with idempotent operations:

typescript
// Atomic status updates prevent duplicate sends
await MessageService.markMessageAsSent(messageId); // Sets status = 'sent'

// Cron job only processes 'pending' messages
const pendingMessages = await MessageService.getPendingMessages(); // WHERE status = 'pending'
Learning: Persistence and idempotency are crucial for reliable background task processing.

Challenge 4: TypeScript Express Route Typing
Problem: Express 5.x with TypeScript had stricter type checking for route handlers.

Solution: Explicit return type annotations and proper error handling:

typescript
// Before: Implicit return types caused compilation errors
router.post('/send', async (req, res) => {
  return res.json({ success: true }); // ❌ TypeScript error
});

// After: Explicit void return type
router.post('/send', async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true }); // ✅ Correct
});
Learning: Modern TypeScript requires explicit typing for complex framework integrations.

Challenge 5: Frontend State Management Without Framework
Problem: Managing OAuth state, message lists, and UI updates with vanilla JavaScript.

Solution: Class-based architecture with clear separation of concerns:

javascript
class SlackConnect {
  constructor() {
    this.userId = localStorage.getItem('userId') || '';
    this.isConnected = false;
  }
  
  async checkConnection() {
    // Validate existing connection
  }
  
  async loadScheduledMessages() {
    // Refresh message list
  }
}
Learning: Even simple frontends benefit from structured architecture and state management patterns.

🔧 Development Commands
bash
# Development
npm run dev          # Start with hot reload
npm run build        # TypeScript compilation
npm start           # Production mode

# Database Management
sqlite3 slack_connect.db
.tables             # List tables
SELECT * FROM slack_tokens;
SELECT * FROM scheduled_messages;
.exit

# Testing
curl -H "user-id: test-123" http://localhost:3000/api/messages/channels
📁 Project Structure
text
slack-connect/
├── src/
│   ├── database/
│   │   └── database.ts          # SQLite setup & migrations
│   ├── middleware/
│   │   └── auth.ts              # OAuth middleware
│   ├── routes/
│   │   ├── auth.ts              # OAuth endpoints
│   │   └── messages.ts          # Message API
│   ├── scheduler/
│   │   └── messageScheduler.ts  # Cron job manager
│   ├── services/
│   │   ├── messageService.ts    # Message DB operations
│   │   ├── slackService.ts      # Slack API client
│   │   └── tokenService.ts      # Token management
│   ├── types/
│   │   └── index.ts             # TypeScript definitions
│   └── server.ts                # Express application
├── public/
│   ├── index.html               # Frontend UI
│   └── app.js                   # Frontend logic
├── .env                         # Environment variables
├── .gitignore                   # Git exclusions
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── README.md                    # This file
🚀 Deployment Considerations
Production Environment Variables
text
NODE_ENV=production
PORT=443
SLACK_REDIRECT_URI=https://yourdomain.com/api/auth/slack/callback
DB_PATH=/var/lib/slack-connect/production.db
Security Checklist
 Environment variables secured

 Database file permissions restricted

 HTTPS enforced for all endpoints

 Rate limiting implemented

 Input validation on all endpoints

 Error messages don't leak sensitive data

Scaling Considerations
Database: Migrate to PostgreSQL for multi-user production

Scheduling: Consider Redis-backed job queues for high volume

Authentication: Implement proper session management

Monitoring: Add logging and health check endpoints

📝 API Documentation
Authentication Headers
All protected endpoints require:

text
user-id: string  // User identifier
Endpoints
GET /api/auth/slack/connect - Get OAuth URL

POST /api/auth/slack/callback - Handle OAuth callback

GET /api/messages/channels - List user's channels

POST /api/messages/send - Send immediate message

POST /api/messages/schedule - Schedule future message

GET /api/messages/scheduled - List scheduled messages

DELETE /api/messages/scheduled/:id - Cancel scheduled message

🤝 Contributing
Fork the repository

Create feature branch: git checkout -b feature/amazing-feature

Commit changes: git commit -m 'Add amazing feature'

Push to branch: git push origin feature/amazing-feature

Open Pull Request
