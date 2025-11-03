const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play music from YouTube, Spotify, or other sources')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name or URL')
                .setRequired(true)),
    
    async execute(interaction, client) {
        const player = useMainPlayer();
        const channel = interaction.member.voice.channel;
        
        if (!channel) {
            return interaction.reply({ 
                content: '❌ You need to be in a voice channel to play music!', 
                ephemeral: true 
            });
        }

        const query = interaction.options.getString('query');
        
        await interaction.deferReply();

        try {
            const { track } = await player.play(channel, query, {
                nodeOptions: {
                    metadata: interaction.channel
                }
            });

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🎵 Now Playing')
                .setDescription(`**${track.title}**`)
                .addFields(
                    { name: 'Duration', value: track.duration, inline: true },
                    { name: 'Requested by', value: interaction.user.toString(), inline: true },
                    { name: 'Source', value: track.source, inline: true }
                )
                .setThumbnail(track.thumbnail)
                .setTimestamp();

            return interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Play command error:', error);
            return interaction.followUp({ 
                content: '❌ Something went wrong while trying to play the track!' 
            });
        }
    },
};