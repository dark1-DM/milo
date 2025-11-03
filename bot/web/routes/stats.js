const express = require('express');

module.exports = (client) => {
    const router = express.Router();

    // Get bot statistics
    router.get('/', (req, res) => {
        try {
            const stats = {
                guilds: client.guilds.cache.size,
                users: client.users.cache.size,
                channels: client.channels.cache.size,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                ping: client.ws.ping,
                botUser: {
                    id: client.user.id,
                    username: client.user.username,
                    discriminator: client.user.discriminator,
                    avatar: client.user.avatar
                }
            };

            res.json(stats);
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    });

    return router;
};