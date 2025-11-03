const Guild = require('../models/Guild');

module.exports = {
    name: 'guildCreate',
    async execute(guild, client) {
        console.log(`✅ Joined new guild: ${guild.name} (${guild.id})`);

        // Create guild document in database
        try {
            const guildData = new Guild({
                guildId: guild.id,
                guildName: guild.name,
                joinedAt: new Date()
            });
            await guildData.save();
            console.log(`📝 Created database entry for ${guild.name}`);
        } catch (error) {
            console.error('Error creating guild document:', error);
        }

        // Send welcome message to the first available text channel
        const channel = guild.channels.cache.find(ch => 
            ch.type === 0 && 
            ch.permissionsFor(guild.members.me).has('SendMessages')
        );

        if (channel) {
            const welcomeEmbed = {
                color: 0x00ff00,
                title: '👋 Thanks for adding me!',
                description: 'I\'m ready to help manage your server!',
                fields: [
                    {
                        name: '🚀 Getting Started',
                        value: 'Use `/help` to see all available commands\nUse `!setup` to configure the bot'
                    },
                    {
                        name: '🌐 Web Dashboard',
                        value: `Visit our [dashboard](${process.env.DASHBOARD_URL || 'http://localhost:3000'}) for easy configuration`
                    },
                    {
                        name: '📋 Features',
                        value: '• Moderation & Security\n• Music Player\n• Fun Commands\n• Reaction Roles\n• And much more!'
                    }
                ],
                footer: {
                    text: 'Need help? Join our support server!',
                    icon_url: client.user.displayAvatarURL()
                },
                timestamp: new Date().toISOString()
            };

            try {
                await channel.send({ embeds: [welcomeEmbed] });
            } catch (error) {
                console.error('Error sending welcome message:', error);
            }
        }
    },
};