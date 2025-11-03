# Milo

A comprehensive Discord bot management platform with public website, user dashboard, admin panel, and premium features.

## 🚀 Features

### Public Website
- **Home Page**: Hero section with features overview and statistics
- **Features Page**: Detailed feature breakdown with categories
- **Pricing Page**: Transparent pricing plans with comparison table
- **About Page**: Team information, company values, and journey timeline
- **Legal Page**: Terms of Service, Privacy Policy, DMCA, and Acceptable Use policies

### User Dashboard (After Login)
- **Main Dashboard**: Overview with server statistics and quick actions
- **Server Management**: Detailed server selection and configuration
- **Server Overview**: Individual server analytics and health monitoring
- **Profile Management**: User account settings and preferences

### Admin Panel (Staff & Developers)
- **User Management**: Comprehensive user administration tools
- **Server Oversight**: Global server management and statistics
- **System Analytics**: Platform-wide metrics and insights
- **System Settings**: Bot configuration and maintenance tools

### Authentication System
- **Discord OAuth2**: Secure login with Discord integration
- **Role-based Access**: Different access levels (User, Premium, Admin)
- **Age Verification**: Integrated 18+ verification system
- **Premium Management**: Subscription status and feature unlocking

## 🛠️ Technical Stack

### Frontend
- **React 19** with TypeScript
- **Material-UI v5** for component library
- **React Router v6** for navigation
- **Axios** for API communication
- **Socket.IO Client** for real-time updates
- **React Toastify** for notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Passport.js** with Discord OAuth2 strategy
- **Socket.IO** for real-time communication
- **JWT** and session-based authentication
- **Helmet** for security middleware
- **Express Rate Limiting** for API protection

### Discord Bot Integration
- **Discord.js v14** with full intent support
- **Comprehensive command system** for all features
- **Real-time bot status** and command execution
- **Multi-server management** capabilities

## 📁 Project Structure

```
discord-bot-dashboard/
├── server/                          # Backend server
│   ├── config/
│   │   └── passport.js             # Discord OAuth2 configuration
│   ├── models/
│   │   ├── User.js                 # User data model with premium/admin features
│   │   ├── Guild.js                # Server configuration model
│   │   ├── Ticket.js               # Support ticket system
│   │   └── Analytics.js            # Analytics and metrics
│   ├── routes/
│   │   ├── public.js               # Public API endpoints
│   │   ├── auth.js                 # Authentication routes
│   │   ├── dashboard.js            # Dashboard API routes
│   │   └── admin.js                # Admin panel routes
│   ├── middleware/
│   │   ├── auth.js                 # Authentication middleware
│   │   └── rateLimit.js            # Rate limiting configuration
│   ├── bot/
│   │   ├── index.js                # Main bot file
│   │   ├── commands/               # Command handlers
│   │   └── events/                 # Event handlers
│   └── index.js                    # Main server entry point
├── frontend/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── PublicNavbar.tsx    # Public site navigation
│   │   │   ├── DashboardNavbar.tsx # Dashboard navigation
│   │   │   ├── PrivateRoute.tsx    # Authentication guard
│   │   │   └── AdminRoute.tsx      # Admin access guard
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx     # Authentication state management
│   │   │   └── SocketContext.tsx   # Real-time communication
│   │   ├── pages/
│   │   │   ├── public/             # Public website pages
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── Pricing.tsx
│   │   │   │   ├── About.tsx
│   │   │   │   └── Legal.tsx
│   │   │   ├── auth/
│   │   │   │   └── Login.tsx       # Discord OAuth login
│   │   │   ├── dashboard/          # User dashboard pages
│   │   │   │   ├── Dashboard.tsx   # Main dashboard
│   │   │   │   ├── ServerSelect.tsx # Server selection
│   │   │   │   ├── Overview.tsx    # Server overview
│   │   │   │   ├── ServerSettings.tsx
│   │   │   │   ├── Moderation.tsx
│   │   │   │   ├── Gaming.tsx
│   │   │   │   ├── Community.tsx
│   │   │   │   ├── Tickets.tsx
│   │   │   │   ├── Premium.tsx
│   │   │   │   ├── NSFWZone.tsx
│   │   │   │   ├── Analytics.tsx
│   │   │   │   └── Profile.tsx
│   │   │   └── admin/
│   │   │       └── AdminPanel.tsx  # Admin management interface
│   │   └── App.tsx                 # Main application component
│   └── package.json                # Frontend dependencies
├── package.json                     # Server dependencies and scripts
└── README.md                       # This file
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB database
- Discord Bot Application

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/discord-bot-dashboard

# Discord Bot
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# JWT & Sessions
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Stripe (for premium features)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# OAuth Redirect
DISCORD_REDIRECT_URI=http://localhost:3000/login
```

Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_DISCORD_CLIENT_ID=your_client_id_here
```

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd discord-bot-dashboard
   npm install
   cd frontend
   npm install
   ```

2. **Start the development servers:**
   ```bash
   # Terminal 1: Start backend server
   npm start

   # Terminal 2: Start frontend development server
   cd frontend
   npm start
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🔧 Development

### Available Scripts

**Root directory (Server):**
- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon
- `npm run bot` - Start only the Discord bot

**Frontend directory:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Key Features Implementation

#### Authentication Flow
1. User clicks "Login with Discord" on public site
2. Redirected to Discord OAuth2 authorization
3. Discord redirects back with authorization code
4. Backend exchanges code for user information
5. JWT token issued and stored in localStorage
6. Protected routes accessible based on user roles

#### Real-time Updates
- Socket.IO connection established on dashboard login
- Real-time bot status updates
- Live server statistics and member activity
- Instant notifications for moderation events

#### Premium System
- Stripe integration for subscription management
- Feature gating based on subscription status
- Usage limits and quota enforcement
- Automatic premium feature activation

#### Admin Panel
- Global user and server management
- System health monitoring
- Analytics and reporting
- Bot configuration and maintenance

## 🎯 Roadmap

### Phase 1 - Core Features (Current)
- ✅ Public website with all marketing pages
- ✅ Discord OAuth2 authentication
- ✅ Basic dashboard structure
- ✅ Admin panel foundation
- ✅ User and server management models

### Phase 2 - Bot Integration
- 🔄 Complete Discord bot implementation
- 🔄 Real-time command execution
- 🔄 Server settings synchronization
- 🔄 Live moderation tools

### Phase 3 - Advanced Features
- ⏳ Premium subscription system
- ⏳ 18+ verification workflow
- ⏳ Advanced analytics dashboard
- ⏳ Ticket system implementation

### Phase 4 - Production Ready
- ⏳ Comprehensive testing suite
- ⏳ Performance optimization
- ⏳ Security auditing
- ⏳ Deployment automation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Create an issue for bug reports or feature requests
- Join our Discord server for community support
- Check the documentation for detailed guides

## 👥 Team

Built with ❤️ by the Milo team:
- **Lead Developer**: Full-stack development and architecture
- **Backend Developer**: API design and database optimization
- **Frontend Developer**: UI/UX design and React development
- **Community Manager**: User feedback and feature planning

---

**Milo** - Transform your Discord server with our comprehensive management platform!#   m i l o  
 