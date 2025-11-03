const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const passport = require('passport');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const ticketRoutes = require('./routes/tickets');
const analyticsRoutes = require('./routes/analytics');
const verificationRoutes = require('./routes/verification');

// Import middleware
const authMiddleware = require('./middleware/auth');
const adminMiddleware = require('./middleware/admin');
const premiumMiddleware = require('./middleware/premium');

class MainServer {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST", "PUT", "DELETE"]
            }
        });
        this.port = process.env.SERVER_PORT || 8000;
    }

    async initialize() {
        // Database connection
        await this.connectDatabase();
        
        // Configure middleware
        this.configureMiddleware();
        
        // Setup passport
        this.setupPassport();
        
        // Setup routes
        this.setupRoutes();
        
        // Setup Socket.IO
        this.setupSocketIO();
        
        // Error handling
        this.setupErrorHandling();
        
        // Start server
        this.start();
    }

    async connectDatabase() {
        try {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/discord-bot-pro', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            process.exit(1);
        }
    }

    configureMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: false, // Allow for development
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        });
        this.app.use('/api/', limiter);

        // CORS
        this.app.use(cors({
            origin: [
                process.env.FRONTEND_URL || 'http://localhost:3000',
                process.env.BOT_DASHBOARD_URL || 'http://localhost:3001'
            ],
            credentials: true
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Session configuration
        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'your-secret-key',
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({
                mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/discord-bot-pro'
            }),
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            }
        }));

        // Passport middleware
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        // Static files
        this.app.use(express.static(path.join(__dirname, '../frontend/build')));
    }

    setupPassport() {
        require('./config/passport')(passport);
    }

    setupRoutes() {
        // API routes
        this.app.use('/api/public', publicRoutes);
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/dashboard', authMiddleware, dashboardRoutes);
        this.app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);
        this.app.use('/api/payments', authMiddleware, paymentRoutes);
        this.app.use('/api/tickets', authMiddleware, ticketRoutes);
        this.app.use('/api/analytics', authMiddleware, analyticsRoutes);
        this.app.use('/api/verification', authMiddleware, verificationRoutes);

        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                version: require('../package.json').version,
                uptime: process.uptime()
            });
        });

        // Serve React app for all other routes
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
        });
    }

    setupSocketIO() {
        this.io.use((socket, next) => {
            // Authentication middleware for socket connections
            const token = socket.handshake.auth.token;
            if (token) {
                // Verify JWT token here
                // Add user info to socket
                next();
            } else {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Join rooms based on user permissions
            socket.on('join-server', (serverId) => {
                socket.join(`server-${serverId}`);
            });

            socket.on('join-admin', () => {
                if (socket.user && socket.user.isAdmin) {
                    socket.join('admin');
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        // Global server instance for use in other modules
        global.io = this.io;
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res, next) => {
            if (req.originalUrl.startsWith('/api/')) {
                res.status(404).json({ error: 'API endpoint not found' });
            } else {
                next();
            }
        });

        // Error handler
        this.app.use((error, req, res, next) => {
            console.error('Server error:', error);
            
            if (req.originalUrl.startsWith('/api/')) {
                res.status(500).json({ 
                    error: process.env.NODE_ENV === 'production' 
                        ? 'Internal server error' 
                        : error.message 
                });
            } else {
                res.status(500).send('Something went wrong!');
            }
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🌐 Main server running on port ${this.port}`);
            console.log(`📊 Dashboard: ${process.env.FRONTEND_URL || `http://localhost:${this.port}`}`);
        });
    }

    // Method to emit events to specific rooms
    emitToServer(serverId, event, data) {
        this.io.to(`server-${serverId}`).emit(event, data);
    }

    emitToAdmins(event, data) {
        this.io.to('admin').emit(event, data);
    }

    emitGlobal(event, data) {
        this.io.emit(event, data);
    }
}

// Initialize server
const server = new MainServer();
server.initialize();

// Export for use in other modules
module.exports = server;