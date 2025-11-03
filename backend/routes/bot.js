const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Client } = require('discord.js');

// Bot instance (this would typically be imported from your bot module)
let botClient = null;

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get bot status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = {
      online: botClient?.isReady() || false,
      uptime: botClient?.uptime || 0,
      guilds: botClient?.guilds.cache.size || 0,
      users: botClient?.users.cache.size || 0,
      ping: botClient?.ws.ping || 0,
      lastReady: botClient?.readyAt || null
    };

    res.json({
      success: true,
      data: status,
      message: 'Bot status retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching bot status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Execute bot command
router.post('/command/:guildId', authenticateToken, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { command, args } = req.body;

    if (!botClient?.isReady()) {
      return res.status(503).json({ error: 'Bot is not online' });
    }

    const guild = botClient.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    // Verify user has permission to execute commands in this guild
    const member = guild.members.cache.get(req.user.discordId);
    if (!member || !member.permissions.has('MANAGE_GUILD')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Execute command (this is a simplified example)
    const result = await executeCommand(guild, command, args);

    res.json({
      success: true,
      data: result,
      message: 'Command executed successfully'
    });
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get guild bot settings
router.get('/settings/:guildId', authenticateToken, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    if (!botClient?.isReady()) {
      return res.status(503).json({ error: 'Bot is not online' });
    }

    const guild = botClient.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    // Get guild settings from database
    const Guild = require('../models/Guild');
    const guildSettings = await Guild.findOne({ guildId });

    res.json({
      success: true,
      data: guildSettings || { guildId, settings: {} },
      message: 'Guild bot settings retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching guild settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update guild bot settings
router.put('/settings/:guildId', authenticateToken, async (req, res) => {
  try {
    const { guildId } = req.params;
    const settings = req.body;

    if (!botClient?.isReady()) {
      return res.status(503).json({ error: 'Bot is not online' });
    }

    const guild = botClient.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    // Verify user has permission
    const member = guild.members.cache.get(req.user.discordId);
    if (!member || !member.permissions.has('MANAGE_GUILD')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update guild settings in database
    const Guild = require('../models/Guild');
    const updatedGuild = await Guild.findOneAndUpdate(
      { guildId },
      { $set: settings },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: updatedGuild,
      message: 'Guild bot settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating guild settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get guild members
router.get('/members/:guildId', authenticateToken, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    if (!botClient?.isReady()) {
      return res.status(503).json({ error: 'Bot is not online' });
    }

    const guild = botClient.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    // Fetch members
    await guild.members.fetch();
    
    const members = guild.members.cache.map(member => ({
      id: member.id,
      username: member.user.username,
      discriminator: member.user.discriminator,
      avatar: member.user.displayAvatarURL(),
      joinedAt: member.joinedAt,
      roles: member.roles.cache.map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor
      })),
      permissions: member.permissions.toArray()
    }));

    res.json({
      success: true,
      data: members,
      message: 'Guild members retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching guild members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simplified command execution function
async function executeCommand(guild, command, args) {
  // This is a placeholder for actual command execution
  // In a real bot, you'd have a command handler system
  
  switch (command) {
    case 'ping':
      return { response: 'Pong!', executedAt: new Date() };
    
    case 'membercount':
      return { 
        response: `This server has ${guild.memberCount} members`, 
        executedAt: new Date() 
      };
    
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

// Function to set bot client (would be called from your main bot file)
function setBotClient(client) {
  botClient = client;
}

module.exports = { router, setBotClient };
module.exports = router;