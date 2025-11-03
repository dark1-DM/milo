const express = require('express');
const User = require('../../models/User');
const { verifyToken, checkGuildPermission } = require('../middleware/auth');

module.exports = (client) => {
    const router = express.Router();

    // Get users in a guild
    router.get('/:guildId', verifyToken, checkGuildPermission, async (req, res) => {
        try {
            const { guildId } = req.params;
            const { page = 1, limit = 50, search = '' } = req.query;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({ error: 'Guild not found' });
            }

            let members = Array.from(guild.members.cache.values());

            // Filter by search term
            if (search) {
                members = members.filter(member => 
                    member.user.username.toLowerCase().includes(search.toLowerCase()) ||
                    member.displayName.toLowerCase().includes(search.toLowerCase())
                );
            }

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedMembers = members.slice(startIndex, endIndex);

            const users = paginatedMembers.map(member => ({
                id: member.user.id,
                username: member.user.username,
                discriminator: member.user.discriminator,
                displayName: member.displayName,
                avatar: member.user.avatar,
                bot: member.user.bot,
                joinedAt: member.joinedAt,
                roles: member.roles.cache.map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.color
                })),
                presence: member.presence?.status || 'offline'
            }));

            res.json({
                users,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(members.length / limit),
                    count: members.length
                }
            });

        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    });

    // Get specific user info
    router.get('/:guildId/:userId', verifyToken, checkGuildPermission, async (req, res) => {
        try {
            const { guildId, userId } = req.params;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({ error: 'Guild not found' });
            }

            const member = guild.members.cache.get(userId);
            if (!member) {
                return res.status(404).json({ error: 'User not found in guild' });
            }

            // Get user data from database
            const userData = await User.findOne({ userId, guildId });

            res.json({
                id: member.user.id,
                username: member.user.username,
                discriminator: member.user.discriminator,
                displayName: member.displayName,
                avatar: member.user.avatar,
                bot: member.user.bot,
                joinedAt: member.joinedAt,
                createdAt: member.user.createdAt,
                roles: member.roles.cache.map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.color
                })),
                presence: member.presence?.status || 'offline',
                permissions: member.permissions.toArray(),
                data: userData || {}
            });

        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Failed to fetch user info' });
        }
    });

    return router;
};