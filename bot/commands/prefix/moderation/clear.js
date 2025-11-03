const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Clears a specified number of messages',
    aliases: ['purge', 'delete'],
    permissions: [PermissionFlagsBits.ManageMessages],
    async execute(message, args, client) {
        const amount = parseInt(args[0]);

        if (!amount || amount < 1 || amount > 100) {
            return message.reply('❌ Please provide a number between 1 and 100!');
        }

        try {
            const deleted = await message.channel.bulkDelete(amount + 1, true);
            const reply = await message.channel.send(`✅ Deleted ${deleted.size - 1} messages!`);
            
            // Delete the success message after 5 seconds
            setTimeout(() => {
                reply.delete().catch(console.error);
            }, 5000);
        } catch (error) {
            console.error('Clear command error:', error);
            message.reply('❌ There was an error trying to delete messages!');
        }
    },
};