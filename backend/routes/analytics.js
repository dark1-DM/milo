const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Analytics = require('../models/Analytics');

// GET /api/analytics - Get user analytics
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const userId = req.user._id;
    
    // Get date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    const analytics = await Analytics.find({
      userId: userId,
      timestamp: { $gte: startDate, $lte: now }
    }).sort({ timestamp: -1 });
    
    // Aggregate data
    const summary = await Analytics.getAnalyticsSummary(userId, startDate, now);
    
    res.json({
      success: true,
      analytics: analytics,
      summary: summary,
      timeframe: timeframe
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/analytics/summary - Get analytics summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const summary = await Analytics.getAnalyticsSummary(userId);
    
    res.json({
      success: true,
      summary: summary
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/analytics - Record analytics event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { eventType, eventData, guildId } = req.body;
    
    const analytics = new Analytics({
      userId: req.user._id,
      guildId: guildId,
      eventType: eventType,
      eventData: eventData,
      timestamp: new Date()
    });
    
    await analytics.save();
    
    res.json({
      success: true,
      analytics: analytics
    });
  } catch (error) {
    console.error('Error recording analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/analytics/guilds/:guildId - Get guild-specific analytics
router.get('/guilds/:guildId', authMiddleware, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { timeframe = '7d' } = req.query;
    
    // Get date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    const analytics = await Analytics.find({
      userId: req.user._id,
      guildId: guildId,
      timestamp: { $gte: startDate, $lte: now }
    }).sort({ timestamp: -1 });
    
    const summary = await Analytics.getGuildAnalytics(guildId, startDate, now);
    
    res.json({
      success: true,
      analytics: analytics,
      summary: summary,
      guildId: guildId,
      timeframe: timeframe
    });
  } catch (error) {
    console.error('Error fetching guild analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;