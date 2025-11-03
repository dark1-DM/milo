const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['command', 'event', 'join', 'leave', 'message', 'voice']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  userId: {
    type: String,
    index: true
  },
  channelId: {
    type: String,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  // Automatically expire documents after 90 days
  expireAfterSeconds: 7776000
});

// Indexes for efficient querying
analyticsSchema.index({ guildId: 1, type: 1, timestamp: -1 });
analyticsSchema.index({ userId: 1, timestamp: -1 });
analyticsSchema.index({ timestamp: -1 });

// Static methods for analytics
analyticsSchema.statics.getGuildStats = async function(guildId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        guildId: guildId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    }
  ]);
  
  return stats;
};

analyticsSchema.statics.getUserActivity = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const activity = await this.aggregate([
    {
      $match: {
        userId: userId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          type: '$type'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);
  
  return activity;
};

analyticsSchema.statics.getSystemStats = async function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          type: '$type'
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueGuilds: { $addToSet: '$guildId' }
      }
    },
    {
      $project: {
        date: '$_id.date',
        type: '$_id.type',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueGuilds: { $size: '$uniqueGuilds' }
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);
  
  return stats;
};

// Instance methods
analyticsSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Analytics', analyticsSchema);