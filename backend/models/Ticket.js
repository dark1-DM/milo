const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  guildId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  channelId: {
    type: String,
    index: true
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['support', 'bug', 'feature', 'appeal', 'report', 'other'],
    default: 'support'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'waiting', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  assignedTo: {
    userId: String,
    username: String,
    assignedAt: {
      type: Date,
      default: Date.now
    }
  },
  messages: [{
    messageId: String,
    userId: String,
    username: String,
    content: String,
    attachments: [String],
    timestamp: {
      type: Date,
      default: Date.now
    },
    isStaff: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    maxlength: 50
  }],
  metadata: {
    userInfo: {
      username: String,
      discriminator: String,
      avatar: String,
      joinedAt: Date
    },
    guildInfo: {
      name: String,
      icon: String,
      memberCount: Number
    },
    systemInfo: {
      browser: String,
      os: String,
      timestamp: Date
    }
  },
  resolution: {
    resolvedBy: String,
    resolvedAt: Date,
    resolution: String,
    satisfaction: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
ticketSchema.index({ guildId: 1, status: 1, createdAt: -1 });
ticketSchema.index({ userId: 1, status: 1, createdAt: -1 });
ticketSchema.index({ 'assignedTo.userId': 1, status: 1 });
ticketSchema.index({ category: 1, priority: 1 });
ticketSchema.index({ lastActivity: -1 });

// Pre-save middleware to update lastActivity
ticketSchema.pre('save', function(next) {
  if (this.isModified() && !this.isModified('lastActivity')) {
    this.lastActivity = new Date();
  }
  next();
});

// Static methods
ticketSchema.statics.generateTicketId = function() {
  return 'TKT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
};

ticketSchema.statics.getGuildStats = async function(guildId) {
  const stats = await this.aggregate([
    { $match: { guildId: guildId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgResolutionTime: {
          $avg: {
            $cond: {
              if: { $ne: ['$resolution.resolvedAt', null] },
              then: { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
              else: null
            }
          }
        }
      }
    }
  ]);
  
  return stats;
};

ticketSchema.statics.getUserTickets = function(userId, limit = 20) {
  return this.find({ userId })
    .sort({ lastActivity: -1 })
    .limit(limit)
    .select('-messages -metadata');
};

ticketSchema.statics.getAssignedTickets = function(staffUserId, limit = 50) {
  return this.find({ 
    'assignedTo.userId': staffUserId,
    status: { $in: ['open', 'in-progress', 'waiting'] }
  })
    .sort({ priority: -1, lastActivity: -1 })
    .limit(limit);
};

// Instance methods
ticketSchema.methods.addMessage = function(userId, username, content, isStaff = false, attachments = []) {
  this.messages.push({
    messageId: new mongoose.Types.ObjectId().toString(),
    userId,
    username,
    content,
    attachments,
    isStaff,
    timestamp: new Date()
  });
  
  this.lastActivity = new Date();
  return this.save();
};

ticketSchema.methods.assignTo = function(staffUserId, staffUsername) {
  this.assignedTo = {
    userId: staffUserId,
    username: staffUsername,
    assignedAt: new Date()
  };
  
  this.status = 'in-progress';
  this.lastActivity = new Date();
  return this.save();
};

ticketSchema.methods.resolve = function(resolvedBy, resolution, satisfaction = null, feedback = null) {
  this.resolution = {
    resolvedBy,
    resolvedAt: new Date(),
    resolution,
    satisfaction,
    feedback
  };
  
  this.status = 'resolved';
  this.lastActivity = new Date();
  return this.save();
};

ticketSchema.methods.close = function() {
  this.status = 'closed';
  this.lastActivity = new Date();
  return this.save();
};

ticketSchema.methods.toSafeObject = function(includeMessages = true) {
  const obj = this.toObject();
  delete obj.__v;
  
  if (!includeMessages) {
    delete obj.messages;
  }
  
  return obj;
};

module.exports = mongoose.model('Ticket', ticketSchema);