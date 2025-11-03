const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands'),
    
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🤖 Bot Commands')
            .setDescription('Here are all the available commands:')
            .addFields(
                {
                    name: '🎵 Music Commands',
                    value: '`/play` - Play music\n`/pause` - Pause music\n`/resume` - Resume music\n`/stop` - Stop music\n`/skip` - Skip current song\n`/queue` - Show queue\n`/volume` - Set volume',
                    inline: true
                },
                {
                    name: '🛡️ Moderation Commands',
                    value: '`/ban` - Ban a user\n`/kick` - Kick a user\n`/mute` - Mute a user\n`/unmute` - Unmute a user\n`/warn` - Warn a user\n`/clear` - Clear messages',
                    inline: true
                },
                {
                    name: '🎮 Fun Commands',
                    value: '`/8ball` - Ask the magic 8-ball\n`/meme` - Get a random meme\n`/joke` - Get a random joke\n`/roll` - Roll dice\n`/coinflip` - Flip a coin',
                    inline: true
                },
                {
                    name: '📊 Utility Commands',
                    value: '`/serverinfo` - Server information\n`/userinfo` - User information\n`/avatar` - Get user avatar\n`/ping` - Check bot latency',
                    inline: true
                },
                {
                    name: '⚙️ Configuration',
                    value: '`/setup` - Configure the bot\n`/prefix` - Change command prefix\n`/settings` - View/change settings',
                    inline: true
                },
                {
                    name: '💰 Economy Commands',
                    value: '`/balance` - Check balance\n`/daily` - Claim daily reward\n`/work` - Work for money\n`/shop` - View shop',
                    inline: true
                }
            )
            .setFooter({ 
                text: `Requested by ${interaction.user.username}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        await interaction.reply({ 
            embeds: [embed],
            ephemeral: false
        });
    },
};