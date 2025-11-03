module.exports = {
    name: 'roll',
    description: 'Roll dice (e.g., !roll 2d6)',
    aliases: ['dice'],
    execute(message, args, client) {
        let diceString = args[0] || '1d6';
        
        // Parse dice notation (e.g., 2d6, 1d20)
        const diceRegex = /^(\d+)?d(\d+)$/i;
        const match = diceString.match(diceRegex);
        
        if (!match) {
            return message.reply('❌ Invalid dice format! Use format like `1d6`, `2d20`, etc.');
        }
        
        const numDice = parseInt(match[1] || '1');
        const numSides = parseInt(match[2]);
        
        if (numDice > 10) {
            return message.reply('❌ You can only roll up to 10 dice at once!');
        }
        
        if (numSides > 100) {
            return message.reply('❌ Dice can only have up to 100 sides!');
        }
        
        const rolls = [];
        let total = 0;
        
        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * numSides) + 1;
            rolls.push(roll);
            total += roll;
        }
        
        let result = `🎲 **${diceString.toUpperCase()}**\n`;
        result += `**Rolls:** ${rolls.join(', ')}\n`;
        result += `**Total:** ${total}`;
        
        message.reply(result);
    },
};