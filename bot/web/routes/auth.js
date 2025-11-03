const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');

module.exports = (client) => {
    const router = express.Router();

    // Discord OAuth2 login
    router.get('/discord', (req, res) => {
        const discordAuthUrl = `https://discord.com/api/oauth2/authorize?` +
            `client_id=${process.env.DISCORD_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(process.env.DASHBOARD_URL + '/auth/callback')}&` +
            `response_type=code&` +
            `scope=identify%20guilds`;
        
        res.redirect(discordAuthUrl);
    });

    // Discord OAuth2 callback
    router.post('/callback', async (req, res) => {
        try {
            const { code } = req.body;

            if (!code) {
                return res.status(400).json({ error: 'No authorization code provided' });
            }

            // Exchange code for access token
            const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', {
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.DASHBOARD_URL + '/auth/callback'
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { access_token } = tokenResponse.data;

            // Get user info
            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            const user = userResponse.data;

            // Get user guilds
            const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            const guilds = guildsResponse.data;

            // Filter guilds where user has manage server permission and bot is present
            const managedGuilds = guilds.filter(guild => {
                const hasPermission = (guild.permissions & 0x20) === 0x20; // MANAGE_GUILD
                const botInGuild = client.guilds.cache.has(guild.id);
                return hasPermission && botInGuild;
            });

            // Create JWT token
            const token = jwt.sign(
                { 
                    userId: user.id,
                    username: user.username,
                    discriminator: user.discriminator,
                    avatar: user.avatar,
                    guilds: managedGuilds
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    discriminator: user.discriminator,
                    avatar: user.avatar
                },
                guilds: managedGuilds
            });

        } catch (error) {
            console.error('Auth callback error:', error);
            res.status(500).json({ error: 'Authentication failed' });
        }
    });

    // Verify token
    router.get('/verify', (req, res) => {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            res.json({ user: decoded });
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    });

    // Logout
    router.post('/logout', (req, res) => {
        // With JWT, logout is handled client-side by removing the token
        res.json({ message: 'Logged out successfully' });
    });

    return router;
};