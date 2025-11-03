const { Player } = require('discord-player');

module.exports = (client) => {
    // Initialize Discord Player
    const player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }
    });

    // Load extractors
    player.extractors.loadDefault();

    client.player = player;

    // Player events
    player.events.on('audioTrackAdd', (queue, track) => {
        queue.metadata.send(`🎵 **${track.title}** has been added to the queue!`);
    });

    player.events.on('audioTracksAdd', (queue, tracks) => {
        queue.metadata.send(`🎵 **${tracks.length} tracks** have been added to the queue!`);
    });

    player.events.on('playerStart', (queue, track) => {
        queue.metadata.send(`▶️ Now playing: **${track.title}**`);
    });

    player.events.on('disconnect', (queue) => {
        queue.metadata.send('❌ Disconnected from the voice channel!');
    });

    player.events.on('emptyChannel', (queue) => {
        queue.metadata.send('❌ Voice channel is empty, leaving...');
    });

    player.events.on('emptyQueue', (queue) => {
        queue.metadata.send('✅ Queue finished!');
    });

    player.events.on('error', (queue, error) => {
        console.log(`Music player error: ${error.message}`);
        queue.metadata.send('❌ Something went wrong with the music player!');
    });

    console.log('🎵 Music handler loaded');
};