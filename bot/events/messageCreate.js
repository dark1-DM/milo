const Guild = require('../models/Guild');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignore bots
        if (message.author.bot) return;

        // Ignore DMs
        if (!message.guild) return;

        // Get guild settings
        let guildData = await Guild.findOne({ guildId: message.guild.id });
        if (!guildData) {
            guildData = new Guild({
                guildId: message.guild.id,
                guildName: message.guild.name
            });
            await guildData.save();
        }

        const prefix = guildData.prefix || '!';

        // Auto-moderation checks
        if (await client.autoMod.checkSpam(message)) {
            return client.autoMod.applyPunishment(message, 'Spam detected');
        }

        if (await client.autoMod.checkBadWords(message)) {
            return client.autoMod.applyPunishment(message, 'Inappropriate language');
        }

        if (await client.autoMod.checkCaps(message)) {
            return client.autoMod.applyPunishment(message, 'Excessive capitalization');
        }

        // Handle prefix commands
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);
        if (!command) return;

        // Check permissions
        if (command.permissions) {
            if (!message.member.permissions.has(command.permissions)) {
                return message.reply('❌ You don\'t have permission to use this command!');
            }
        }

        // Cooldown handling
        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Map());
        }

        const now = Date.now();
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`⏰ Please wait ${timeLeft.toFixed(1)} more seconds before using \`${command.name}\` again.`);
            }
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        // Execute command
        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`Error executing command ${command.name}:`, error);
            message.reply('❌ There was an error executing this command!');
        }
    },
};