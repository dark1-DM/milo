# Discord Bot Dashboard Backend

A standalone Node.js/Express API server for the Discord Bot Dashboard Pro platform.

## 🚀 Features

- **RESTful API**: Complete REST API for Discord bot management
- **Real-time Communication**: Socket.IO for live updates
- **Authentication**: Discord OAuth2 with JWT tokens
- **Security**: Rate limiting, CORS, helmet security headers
- **Database**: MongoDB with Mongoose ODM
- **Payment Integration**: Stripe for premium subscriptions
- **Bot Integration**: Discord.js v14 with full bot functionality
- **Logging**: Winston structured logging
- **Error Handling**: Comprehensive error management

## 📁 Project Structure

```
backend/
├── index.js                 # Main server entry point
├── config/
│   └── passport.js          # Discord OAuth2 configuration
├── models/
│   ├── User.js             # User data model
│   ├── Guild.js            # Server configuration model
│   ├── Ticket.js           # Support ticket system
│   └── Analytics.js        # Analytics and metrics
├── routes/
│   ├── public.js           # Public API endpoints
│   ├── auth.js             # Authentication routes
│   ├── dashboard.js        # Dashboard API routes
│   ├── admin.js            # Admin panel routes
│   └── bot.js              # Bot management routes
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── rateLimit.js        # Rate limiting configuration
├── bot/
│   ├── index.js            # Discord bot main file
│   ├── commands/           # Bot command handlers
│   └── events/             # Bot event handlers
└── logs/                   # Application logs
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- MongoDB
- Discord Bot Application

### Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Start production server
npm start
```

## 🔧 Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/discord-bot-dashboard

# Discord
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# CORS (Frontend URLs)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

## 📚 API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://api.yourdomain.com/api`

### Endpoints

#### Public Routes
- `GET /api/public/stats` - Get public statistics
- `GET /api/public/features` - Get feature list
- `GET /api/public/pricing` - Get pricing plans

#### Authentication
- `GET /api/auth/discord` - Start Discord OAuth
- `GET /api/auth/discord/callback` - OAuth callback
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

#### Dashboard
- `GET /api/dashboard/guilds` - Get user's guilds
- `GET /api/dashboard/guild/:id` - Get guild details
- `PUT /api/dashboard/guild/:id` - Update guild settings

#### Admin (Requires admin role)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/guilds` - Get all guilds
- `GET /api/admin/analytics` - Get system analytics

#### Bot Management
- `POST /api/bot/command/:guildId` - Execute bot command
- `GET /api/bot/status` - Get bot status
- `PUT /api/bot/settings/:guildId` - Update bot settings

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔒 Authentication

The API uses Discord OAuth2 for authentication and JWT tokens for session management.

### Flow
1. Frontend redirects to `/api/auth/discord`
2. User authorizes on Discord
3. Discord redirects to callback with code
4. Backend exchanges code for user info
5. JWT token issued and returned to frontend
6. Frontend includes token in Authorization header

### Protected Routes
Include JWT token in requests:
```javascript
headers: {
  'Authorization': 'Bearer your_jwt_token'
}
```

## 🔌 Real-time Features

Socket.IO connection for real-time updates:

```javascript
// Frontend connection
const socket = io('http://localhost:5000');

// Authenticate socket
socket.emit('authenticate', jwt_token);

// Join guild room for updates
socket.emit('join-guild', guild_id);

// Listen for events
socket.on('guild_update', (data) => {
  // Handle guild updates
});
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Set environment to production
export NODE_ENV=production

# Start server
npm start
```

### Docker
```bash
# Build image
docker build -t discord-bot-backend .

# Run container
docker run -d -p 5000:5000 --env-file .env discord-bot-backend
```

### PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start index.js --name discord-bot-backend

# Monitor
pm2 monit

# Logs
pm2 logs discord-bot-backend
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "uptime": 3600,
  "memory": {
    "rss": 50000000,
    "heapTotal": 30000000,
    "heapUsed": 20000000
  }
}
```

### Logs
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Console output in development

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🔧 Development

### Adding New Routes
1. Create route file in `routes/`
2. Add route to `index.js`
3. Add authentication middleware if needed
4. Update API documentation

### Database Models
Models are defined in `models/` using Mongoose schemas.

### Bot Commands
Add new bot commands in `bot/commands/` directory.

## 📈 Performance

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Compression**: Gzip compression enabled
- **Caching**: MongoDB session store with TTL
- **Connection Pooling**: Mongoose connection pooling
- **Logging**: Structured logging with Winston

## 🔐 Security

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: IP-based rate limiting
- **Input Validation**: Express-validator for request validation
- **Session Security**: Secure cookies, HttpOnly, SameSite
- **JWT**: Stateless authentication tokens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

---

**Discord Bot Dashboard Backend** - Powering your Discord bot management platform! 🚀