const Guild = require('../models/Guild');

module.exports = (client) => {
    // Auto-moderation functions
    client.autoMod = {
        // Check for spam
        checkSpam: async (message) => {
            const guild = await Guild.findOne({ guildId: message.guild.id });
            if (!guild || !guild.moderation.autoMod.enabled) return false;

            const userMessages = client.recentMessages?.get(message.author.id) || [];
            userMessages.push(Date.now());
            
            // Keep only messages from last 5 seconds
            const recent = userMessages.filter(time => Date.now() - time < 5000);
            client.recentMessages?.set(message.author.id, recent);

            return recent.length > guild.moderation.autoMod.spamLimit;
        },

        // Check for bad words
        checkBadWords: async (message) => {
            const guild = await Guild.findOne({ guildId: message.guild.id });
            if (!guild || !guild.moderation.autoMod.enabled) return false;

            const badWords = guild.moderation.badWords || [];
            const content = message.content.toLowerCase();
            
            return badWords.some(word => content.includes(word.toLowerCase()));
        },

        // Check for excessive caps
        checkCaps: async (message) => {
            const guild = await Guild.findOne({ guildId: message.guild.id });
            if (!guild || !guild.moderation.autoMod.enabled) return false;

            const content = message.content;
            if (content.length < 10) return false;

            const capsCount = (content.match(/[A-Z]/g) || []).length;
            const capsPercentage = (capsCount / content.length) * 100;
            
            return capsPercentage > guild.moderation.autoMod.capsLimit;
        },

        // Apply punishment
        applyPunishment: async (message, reason) => {
            const guild = await Guild.findOne({ guildId: message.guild.id });
            if (!guild) return;

            try {
                // Delete the message
                await message.delete();

                // Get punishment type
                const punishment = guild.moderation.autoMod.punishment || 'warn';

                switch (punishment) {
                    case 'warn':
                        await client.moderation.warnUser(message.member, message.guild.members.me, reason);
                        break;
                    case 'mute':
                        await client.moderation.muteUser(message.member, message.guild.members.me, '10m', reason);
                        break;
                    case 'kick':
                        await message.member.kick(reason);
                        break;
                    case 'ban':
                        await message.member.ban({ reason, deleteMessageDays: 1 });
                        break;
                }

                // Log the action
                await client.moderation.logAction({
                    guild: message.guild,
                    action: punishment,
                    moderator: message.guild.members.me,
                    target: message.member,
                    reason: `Auto-moderation: ${reason}`
                });

            } catch (error) {
                console.error('Auto-moderation error:', error);
            }
        }
    };

    // Moderation functions
    client.moderation = {
        // Warn user
        warnUser: async (member, moderator, reason) => {
            // Implementation for warning users
            // This would save to database and send DM
        },

        // Mute user
        muteUser: async (member, moderator, duration, reason) => {
            // Implementation for muting users
            // This would add a mute role or use Discord's timeout feature
        },

        // Log moderation action
        logAction: async (data) => {
            // Implementation for logging moderation actions
            // This would save to database and send to log channel
        }
    };

    // Initialize recent messages tracking
    client.recentMessages = new Map();

    console.log('🛡️ Moderation handler loaded');
};