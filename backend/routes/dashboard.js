const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Guild = require('../models/Guild');

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

// Get user's guilds
router.get('/guilds', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('guilds');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user.guilds,
      message: 'Guilds retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching guilds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific guild details
router.get('/guild/:id', authenticateToken, async (req, res) => {
  try {
    const guild = await Guild.findOne({ 
      guildId: req.params.id,
      'admins.userId': req.user.id 
    });

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found or access denied' });
    }

    res.json({
      success: true,
      data: guild,
      message: 'Guild details retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching guild:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update guild settings
router.put('/guild/:id', authenticateToken, async (req, res) => {
  try {
    const guild = await Guild.findOneAndUpdate(
      { 
        guildId: req.params.id,
        'admins.userId': req.user.id 
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found or access denied' });
    }

    res.json({
      success: true,
      data: guild,
      message: 'Guild settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating guild:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user,
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = ['preferences', 'settings'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('guilds');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = {
      totalGuilds: user.guilds.length,
      activeGuilds: user.guilds.filter(g => g.active).length,
      totalMembers: user.guilds.reduce((sum, g) => sum + (g.memberCount || 0), 0),
      premiumGuilds: user.guilds.filter(g => g.premium).length
    };

    res.json({
      success: true,
      data: stats,
      message: 'Dashboard stats retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;