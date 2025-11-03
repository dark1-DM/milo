const express = require('express');
const Guild = require('../../models/Guild');
const { verifyToken, checkGuildPermission } = require('../middleware/auth');

module.exports = (client) => {
    const router = express.Router();

    // Get guild configuration
    router.get('/:guildId', verifyToken, checkGuildPermission, async (req, res) => {
        try {
            const { guildId } = req.params;
            
            let guildConfig = await Guild.findOne({ guildId });
            if (!guildConfig) {
                const guild = client.guilds.cache.get(guildId);
                guildConfig = new Guild({
                    guildId,
                    guildName: guild?.name || 'Unknown Guild'
                });
                await guildConfig.save();
            }

            res.json(guildConfig);
        } catch (error) {
            console.error('Get config error:', error);
            res.status(500).json({ error: 'Failed to fetch configuration' });
        }
    });

    // Update guild configuration
    router.put('/:guildId', verifyToken, checkGuildPermission, async (req, res) => {
        try {
            const { guildId } = req.params;
            const updates = req.body;

            let guildConfig = await Guild.findOne({ guildId });
            if (!guildConfig) {
                const guild = client.guilds.cache.get(guildId);
                guildConfig = new Guild({
                    guildId,
                    guildName: guild?.name || 'Unknown Guild'
                });
            }

            // Apply updates
            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined) {
                    if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
                        // Merge nested objects
                        guildConfig[key] = { ...guildConfig[key], ...updates[key] };
                    } else {
                        guildConfig[key] = updates[key];
                    }
                }
            });

            await guildConfig.save();

            res.json({ 
                message: 'Configuration updated successfully', 
                config: guildConfig 
            });
        } catch (error) {
            console.error('Update config error:', error);
            res.status(500).json({ error: 'Failed to update configuration' });
        }
    });

    // Reset guild configuration
    router.delete('/:guildId', verifyToken, checkGuildPermission, async (req, res) => {
        try {
            const { guildId } = req.params;

            await Guild.findOneAndDelete({ guildId });

            // Create new default config
            const guild = client.guilds.cache.get(guildId);
            const newConfig = new Guild({
                guildId,
                guildName: guild?.name || 'Unknown Guild'
            });
            await newConfig.save();

            res.json({ 
                message: 'Configuration reset successfully', 
                config: newConfig 
            });
        } catch (error) {
            console.error('Reset config error:', error);
            res.status(500).json({ error: 'Failed to reset configuration' });
        }
    });

    return router;
};