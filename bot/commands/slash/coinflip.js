const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin'),
    
    async execute(interaction, client) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        const emoji = result === 'Heads' ? '🟡' : '⚪';
        
        const embed = new EmbedBuilder()
            .setColor(result === 'Heads' ? 0xffd700 : 0xc0c0c0)
            .setTitle('🪙 Coin Flip')
            .setDescription(`${emoji} **${result}**`)
            .setFooter({ 
                text: `Flipped by ${interaction.user.username}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};