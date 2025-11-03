const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import handlers
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');
const musicHandler = require('./handlers/musicHandler');
const moderationHandler = require('./handlers/moderationHandler');
const webServer = require('./web/server');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions
    ]
});

// Initialize collections
client.commands = new Collection();
client.slashCommands = new Collection();
client.cooldowns = new Collection();
client.queue = new Collection();

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/discord-bot', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

// Initialize handlers
commandHandler(client);
eventHandler(client);
musicHandler(client);
moderationHandler(client);

// Bot ready event
client.once('ready', () => {
    console.log(`🤖 ${client.user.tag} is online!`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    console.log(`👥 Watching ${client.users.cache.size} users`);
    
    // Set bot activity
    client.user.setActivity('your server | /help', { 
        type: ActivityType.Watching 
    });
    
    // Start web server
    webServer.start(client);
});

// Error handling
client.on('error', console.error);
client.on('warn', console.warn);

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_BOT_TOKEN);