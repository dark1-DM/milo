const express = require('express');
const Guild = require('../../models/Guild');
const { verifyToken, checkGuildPermission } = require('../middleware/auth');

module.exports = (client) => {
    const router = express.Router();

    // Get all guilds the user can manage
    router.get('/', verifyToken, (req, res) => {
        try {
            const userGuilds = req.user.guilds || [];
            const botGuilds = client.guilds.cache.map(guild => ({
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                memberCount: guild.memberCount,
                ownerId: guild.ownerId
            }));

            // Filter bot guilds with user's managed guilds
            const managedGuilds = botGuilds.filter(botGuild => 
                userGuilds.some(userGuild => userGuild.id === botGuild.id)
            );

            res.json(managedGuilds);
        } catch (error) {
            console.error('Get guilds error:', error);
            res.status(500).json({ error: 'Failed to fetch guilds' });
        }
    });

    // Get specific guild info
    router.get('/:guildId', verifyToken, checkGuildPermission, async (req, res) => {
        try {
            const { guildId } = req.params;
            const guild = client.guilds.cache.get(guildId);

            if (!guild) {
                return res.status(404).json({ error: 'Guild not found' });
            }

            const guildData = await Guild.findOne({ guildId }) || new Guild({ guildId });

            res.json({
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                memberCount: guild.memberCount,
                channels: guild.channels.cache.map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type
                })),
                roles: guild.roles.cache.map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.color,
                    permissions: role.permissions.bitfield.toString()
                })),
                settings: guildData
            });
        } catch (error) {
            console.error('Get guild error:', error);
            res.status(500).json({ error: 'Failed to fetch guild info' });
        }
    });

    // Update guild settings
    router.put('/:guildId/settings', verifyToken, checkGuildPermission, async (req, res) => {
        try {
            const { guildId } = req.params;
            const updates = req.body;

            let guildData = await Guild.findOne({ guildId });
            if (!guildData) {
                guildData = new Guild({ guildId });
            }

            // Update settings
            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined) {
                    guildData[key] = updates[key];
                }
            });

            await guildData.save();

            res.json({ message: 'Settings updated successfully', settings: guildData });
        } catch (error) {
            console.error('Update guild settings error:', error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    });

    // Get guild statistics
    router.get('/:guildId/stats', verifyToken, checkGuildPermission, async (req, res) => {
        try {
            const { guildId } = req.params;
            const guild = client.guilds.cache.get(guildId);

            if (!guild) {
                return res.status(404).json({ error: 'Guild not found' });
            }

            // Calculate stats
            const totalMembers = guild.memberCount;
            const botMembers = guild.members.cache.filter(member => member.user.bot).size;
            const humanMembers = totalMembers - botMembers;
            const onlineMembers = guild.members.cache.filter(
                member => member.presence?.status === 'online'
            ).size;

            const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
            const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
            const categories = guild.channels.cache.filter(channel => channel.type === 4).size;

            res.json({
                members: {
                    total: totalMembers,
                    humans: humanMembers,
                    bots: botMembers,
                    online: onlineMembers
                },
                channels: {
                    text: textChannels,
                    voice: voiceChannels,
                    categories: categories,
                    total: guild.channels.cache.size
                },
                roles: guild.roles.cache.size,
                emojis: guild.emojis.cache.size,
                boosts: guild.premiumSubscriptionCount || 0,
                boostLevel: guild.premiumTier || 0
            });
        } catch (error) {
            console.error('Get guild stats error:', error);
            res.status(500).json({ error: 'Failed to fetch guild statistics' });
        }
    });

    return router;
};