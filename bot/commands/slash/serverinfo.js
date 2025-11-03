const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about the current server'),
    
    async execute(interaction, client) {
        const guild = interaction.guild;
        
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`📊 ${guild.name} Information`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
            .addFields(
                {
                    name: '🆔 Server ID',
                    value: guild.id,
                    inline: true
                },
                {
                    name: '👑 Owner',
                    value: `<@${guild.ownerId}>`,
                    inline: true
                },
                {
                    name: '📅 Created',
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                    inline: true
                },
                {
                    name: '👥 Members',
                    value: guild.memberCount.toString(),
                    inline: true
                },
                {
                    name: '💬 Channels',
                    value: guild.channels.cache.size.toString(),
                    inline: true
                },
                {
                    name: '🎭 Roles',
                    value: guild.roles.cache.size.toString(),
                    inline: true
                },
                {
                    name: '😀 Emojis',
                    value: guild.emojis.cache.size.toString(),
                    inline: true
                },
                {
                    name: '🚀 Boost Level',
                    value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`,
                    inline: true
                },
                {
                    name: '🔒 Verification Level',
                    value: guild.verificationLevel.toString(),
                    inline: true
                }
            )
            .setFooter({ 
                text: `Requested by ${interaction.user.username}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        if (guild.banner) {
            embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
        }

        await interaction.reply({ embeds: [embed] });
    },
};