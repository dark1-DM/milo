const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const guildRoutes = require('./routes/guilds');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const configRoutes = require('./routes/config');

class WebServer {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: process.env.DASHBOARD_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        this.port = process.env.PORT || 5000;
        this.client = null;
    }

    async start(client) {
        this.client = client;
        
        // Middleware
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true
        }));
        
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../dashboard/build')));

        // API routes
        this.app.use('/api/auth', authRoutes(client));
        this.app.use('/api/guilds', guildRoutes(client));
        this.app.use('/api/users', userRoutes(client));
        this.app.use('/api/stats', statsRoutes(client));
        this.app.use('/api/config', configRoutes(client));

        // Health check endpoint
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'ok',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                bot: {
                    user: client.user?.tag || 'Not logged in',
                    guilds: client.guilds.cache.size,
                    users: client.users.cache.size
                }
            });
        });

        // Catch-all handler for React Router
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../dashboard/build/index.html'));
        });

        // Socket.IO for real-time updates
        this.setupSocketIO();

        // Start server
        this.server.listen(this.port, () => {
            console.log(`🌐 Web server running on port ${this.port}`);
            console.log(`📊 Dashboard: ${process.env.DASHBOARD_URL || `http://localhost:${this.port}`}`);
        });

        // Error handling
        this.app.use((error, req, res, next) => {
            console.error('API Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            console.log('Dashboard client connected:', socket.id);

            // Join guild rooms for real-time updates
            socket.on('join-guild', (guildId) => {
                socket.join(`guild-${guildId}`);
            });

            socket.on('disconnect', () => {
                console.log('Dashboard client disconnected:', socket.id);
            });
        });

        // Emit real-time stats every 30 seconds
        setInterval(() => {
            if (this.client && this.client.user) {
                this.io.emit('stats-update', {
                    guilds: this.client.guilds.cache.size,
                    users: this.client.users.cache.size,
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage()
                });
            }
        }, 30000);
    }

    // Method to emit events from bot to dashboard
    emit(event, data) {
        this.io.emit(event, data);
    }

    // Method to emit events to specific guild
    emitToGuild(guildId, event, data) {
        this.io.to(`guild-${guildId}`).emit(event, data);
    }
}

module.exports = new WebServer();