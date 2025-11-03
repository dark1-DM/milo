const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)),
    
    permissions: [PermissionFlagsBits.BanMembers],
    
    async execute(interaction, client) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const days = interaction.options.getInteger('days') || 0;

        const member = interaction.guild.members.cache.get(target.id);
        
        if (!member) {
            return interaction.reply({ 
                content: '❌ User not found in this server!', 
                ephemeral: true 
            });
        }

        if (member.id === interaction.user.id) {
            return interaction.reply({ 
                content: '❌ You cannot ban yourself!', 
                ephemeral: true 
            });
        }

        if (member.id === client.user.id) {
            return interaction.reply({ 
                content: '❌ I cannot ban myself!', 
                ephemeral: true 
            });
        }

        if (!member.bannable) {
            return interaction.reply({ 
                content: '❌ I cannot ban this user! They may have higher permissions than me.', 
                ephemeral: true 
            });
        }

        try {
            // Send DM before banning
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('🔨 You have been banned')
                    .setDescription(`You have been banned from **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: interaction.user.toString() }
                    )
                    .setTimestamp();

                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                // User has DMs disabled or blocked the bot
            }

            // Ban the user
            await member.ban({ 
                reason: `${reason} | Moderator: ${interaction.user.tag}`,
                deleteMessageDays: days
            });

            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('🔨 User Banned')
                .setDescription(`**${target.tag}** has been banned from the server`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: interaction.user.toString() },
                    { name: 'Messages Deleted', value: `${days} days` }
                )
                .setThumbnail(target.displayAvatarURL())
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Ban command error:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while trying to ban the user!', 
                ephemeral: true 
            });
        }
    },
};