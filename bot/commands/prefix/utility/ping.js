module.exports = {
    name: 'ping',
    description: 'Shows the bot\'s latency',
    aliases: ['latency'],
    cooldown: 3,
    async execute(message, args, client) {
        const sent = await message.reply('🏓 Pinging...');
        const timeDiff = sent.createdTimestamp - message.createdTimestamp;
        
        await sent.edit(`🏓 Pong!\n**Roundtrip latency:** ${timeDiff}ms\n**WebSocket heartbeat:** ${client.ws.ping}ms`);
    },
};