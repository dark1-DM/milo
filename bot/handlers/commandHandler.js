const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

module.exports = (client) => {
    // Load slash commands
    const slashCommandsPath = path.join(__dirname, '../commands/slash');
    if (fs.existsSync(slashCommandsPath)) {
        const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of slashCommandFiles) {
            const command = require(path.join(slashCommandsPath, file));
            if (command.data && command.execute) {
                client.slashCommands.set(command.data.name, command);
                console.log(`📁 Loaded slash command: ${command.data.name}`);
            }
        }
    }

    // Load prefix commands
    const prefixCommandsPath = path.join(__dirname, '../commands/prefix');
    if (fs.existsSync(prefixCommandsPath)) {
        const commandFolders = fs.readdirSync(prefixCommandsPath);

        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(path.join(prefixCommandsPath, folder)).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const command = require(path.join(prefixCommandsPath, folder, file));
                if (command.name && command.execute) {
                    client.commands.set(command.name, command);
                    console.log(`📁 Loaded prefix command: ${command.name}`);
                    
                    // Add aliases
                    if (command.aliases) {
                        command.aliases.forEach(alias => {
                            client.commands.set(alias, command);
                        });
                    }
                }
            }
        }
    }

    // Register slash commands with Discord
    client.once('ready', async () => {
        const commands = [];
        client.slashCommands.forEach(command => {
            commands.push(command.data.toJSON());
        });

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

        try {
            console.log('🔄 Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );

            console.log('✅ Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('❌ Error refreshing commands:', error);
        }
    });
};