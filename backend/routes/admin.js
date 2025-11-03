const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Guild = require('../models/Guild');
const Analytics = require('../models/Analytics');

// Middleware to verify admin access
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Get all users (paginated)
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all guilds (paginated)
router.get('/guilds', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const guilds = await Guild.find()
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Guild.countDocuments();

    res.json({
      success: true,
      data: {
        guilds,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Guilds retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching guilds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system analytics
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const [userCount, guildCount, activeGuilds, premiumUsers] = await Promise.all([
      User.countDocuments(),
      Guild.countDocuments(),
      Guild.countDocuments({ active: true }),
      User.countDocuments({ isPremium: true })
    ]);

    const analytics = {
      users: {
        total: userCount,
        premium: premiumUsers,
        free: userCount - premiumUsers
      },
      guilds: {
        total: guildCount,
        active: activeGuilds,
        inactive: guildCount - activeGuilds
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    };

    res.json({
      success: true,
      data: analytics,
      message: 'System analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user permissions
router.put('/user/:id', authenticateAdmin, async (req, res) => {
  try {
    const { isAdmin, isPremium, isBlocked } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin, isPremium, isBlocked },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user,
      message: 'User permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/user/:id', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update guild settings
router.put('/guild/:id', authenticateAdmin, async (req, res) => {
  try {
    const guild = await Guild.findOneAndUpdate(
      { guildId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
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

// Delete guild
router.delete('/guild/:id', authenticateAdmin, async (req, res) => {
  try {
    const guild = await Guild.findOneAndDelete({ guildId: req.params.id });

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json({
      success: true,
      message: 'Guild deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting guild:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system logs (recent activity)
router.get('/logs', authenticateAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    // This is a placeholder - in a real app, you'd query your logging system
    const logs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'User logged in',
        metadata: { userId: '123', ip: '192.168.1.1' }
      }
    ];

    res.json({
      success: true,
      data: logs,
      message: 'System logs retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;