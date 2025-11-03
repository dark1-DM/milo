const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    guildName: {
        type: String,
        required: true
    },
    guildIcon: String,
    ownerId: String,
    
    // Basic Settings
    prefix: {
        type: String,
        default: '!'
    },
    language: {
        type: String,
        default: 'en'
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    
    // Premium Status
    isPremium: {
        type: Boolean,
        default: false
    },
    premiumTier: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free'
    },
    premiumActivatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    premiumExpiresAt: Date,
    
    // Channel Configurations
    channels: {
        logs: {
            moderation: String,
            join: String,
            leave: String,
            message: String,
            voice: String,
            audit: String
        },
        tickets: {
            category: String,
            logs: String,
            transcripts: String
        },
        welcome: String,
        announcements: String,
        suggestions: String,
        counting: String,
        starboard: String
    },
    
    // Moderation Settings
    moderation: {
        enabled: {
            type: Boolean,
            default: true
        },
        autoMod: {
            enabled: {
                type: Boolean,
                default: false
            },
            antiSpam: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                maxMessages: {
                    type: Number,
                    default: 5
                },
                timeWindow: {
                    type: Number,
                    default: 5000 // 5 seconds
                },
                punishment: {
                    type: String,
                    enum: ['warn', 'mute', 'kick', 'ban'],
                    default: 'mute'
                },
                duration: {
                    type: Number,
                    default: 300000 // 5 minutes
                }
            },
            antiCaps: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                threshold: {
                    type: Number,
                    default: 70 // percentage
                },
                minLength: {
                    type: Number,
                    default: 10
                }
            },
            antiLinks: {
                enabled: {
                    type: Boolean,
                    default: false
                },
                whitelist: [String],
                blacklist: [String]
            },
            antiInvites: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                allowOwnServer: {
                    type: Boolean,
                    default: true
                }
            },
            badWords: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                words: [String],
                action: {
                    type: String,
                    enum: ['delete', 'warn', 'mute', 'kick', 'ban'],
                    default: 'delete'
                }
            }
        },
        muteRole: String,
        maxWarnings: {
            type: Number,
            default: 3
        },
        warningActions: [{
            threshold: Number,
            action: {
                type: String,
                enum: ['mute', 'kick', 'ban']
            },
            duration: Number // for mute/ban duration
        }],
        staffRoles: [String],
        moderatorRoles: [String],
        adminRoles: [String]
    },
    
    // Welcome & Goodbye System
    welcome: {
        enabled: {
            type: Boolean,
            default: false
        },
        channel: String,
        message: {
            type: String,
            default: 'Welcome {user} to {server}! 🎉'
        },
        embed: {
            enabled: {
                type: Boolean,
                default: false
            },
            title: String,
            description: String,
            color: {
                type: String,
                default: '#5865f2'
            },
            thumbnail: {
                type: Boolean,
                default: true
            },
            footer: String
        },
        autorole: [String],
        dm: {
            enabled: {
                type: Boolean,
                default: false
            },
            message: String
        }
    },
    
    goodbye: {
        enabled: {
            type: Boolean,
            default: false
        },
        channel: String,
        message: {
            type: String,
            default: 'Goodbye {user}! 👋'
        }
    },
    
    // Music System
    music: {
        enabled: {
            type: Boolean,
            default: true
        },
        djRole: String,
        maxQueueSize: {
            type: Number,
            default: 100
        },
        defaultVolume: {
            type: Number,
            default: 50
        },
        allowedChannels: [String],
        restrictToVoice: {
            type: Boolean,
            default: false
        },
        leaveOnEmpty: {
            type: Boolean,
            default: true
        },
        leaveOnEnd: {
            type: Boolean,
            default: true
        },
        leaveTimeout: {
            type: Number,
            default: 300000 // 5 minutes
        }
    },
    
    // Ticket System
    tickets: {
        enabled: {
            type: Boolean,
            default: false
        },
        category: String,
        supportRoles: [String],
        autoArchive: {
            type: Boolean,
            default: true
        },
        archiveAfter: {
            type: Number,
            default: 24 // hours
        },
        maxTickets: {
            type: Number,
            default: 3
        },
        categories: [{
            name: String,
            emoji: String,
            description: String,
            supportRoles: [String]
        }],
        transcripts: {
            enabled: {
                type: Boolean,
                default: true
            },
            channel: String
        }
    },
    
    // Leveling System
    leveling: {
        enabled: {
            type: Boolean,
            default: false
        },
        channel: String,
        message: {
            type: String,
            default: 'Congratulations {user}! You reached level {level}! 🎉'
        },
        xpPerMessage: {
            type: Number,
            default: 15
        },
        xpCooldown: {
            type: Number,
            default: 60000 // 1 minute
        },
        levelRoles: [{
            level: Number,
            role: String,
            remove: {
                type: Boolean,
                default: false
            }
        }],
        ignoredChannels: [String],
        ignoredRoles: [String]
    },
    
    // Economy System
    economy: {
        enabled: {
            type: Boolean,
            default: false
        },
        currency: {
            name: {
                type: String,
                default: 'coins'
            },
            emoji: {
                type: String,
                default: '🪙'
            }
        },
        daily: {
            amount: {
                type: Number,
                default: 100
            },
            cooldown: {
                type: Number,
                default: 86400000 // 24 hours
            }
        },
        work: {
            enabled: {
                type: Boolean,
                default: true
            },
            cooldown: {
                type: Number,
                default: 3600000 // 1 hour
            },
            minAmount: {
                type: Number,
                default: 50
            },
            maxAmount: {
                type: Number,
                default: 200
            }
        }
    },
    
    // Reaction Roles
    reactionRoles: [{
        messageId: String,
        channelId: String,
        title: String,
        description: String,
        roles: [{
            emoji: String,
            roleId: String,
            description: String
        }],
        type: {
            type: String,
            enum: ['single', 'multiple', 'unique'],
            default: 'single'
        },
        requiredRole: String,
        maxRoles: Number
    }],
    
    // 18+ Verification System
    ageVerification: {
        enabled: {
            type: Boolean,
            default: false
        },
        method: {
            type: String,
            enum: ['reaction', 'manual', 'hybrid'],
            default: 'reaction'
        },
        verifiedRole: String,
        unverifiedRole: String,
        nsfwChannels: [String],
        verificationChannel: String,
        staffRoles: [String],
        consentMessage: {
            type: String,
            default: 'By clicking the reaction below, you confirm that you are 18 years of age or older and consent to viewing adult content.'
        },
        requireManualApproval: {
            type: Boolean,
            default: false
        },
        logChannel: String
    },
    
    // Gaming Features
    gaming: {
        gameRoles: {
            enabled: {
                type: Boolean,
                default: false
            },
            games: [{
                name: String,
                roleId: String,
                autoAssign: {
                    type: Boolean,
                    default: true
                }
            }]
        },
        lfg: {
            enabled: {
                type: Boolean,
                default: false
            },
            channel: String,
            autoDelete: {
                type: Number,
                default: 24 // hours
            }
        },
        events: {
            enabled: {
                type: Boolean,
                default: false
            },
            channel: String,
            pingRole: String
        }
    },
    
    // Statistics & Analytics
    stats: {
        memberCount: {
            type: Number,
            default: 0
        },
        messageCount: {
            type: Number,
            default: 0
        },
        commandsUsed: {
            type: Number,
            default: 0
        },
        ticketsCreated: {
            type: Number,
            default: 0
        },
        moderationActions: {
            type: Number,
            default: 0
        }
    },
    
    // Activity & Status
    isActive: {
        type: Boolean,
        default: true
    },
    lastActivity: Date,
    joinedAt: {
        type: Date,
        default: Date.now
    },
    leftAt: Date
}, {
    timestamps: true
});

// Indexes
guildSchema.index({ guildId: 1 });
guildSchema.index({ isPremium: 1 });
guildSchema.index({ isActive: 1 });
guildSchema.index({ ownerId: 1 });

// Methods
guildSchema.methods.isPremiumActive = function() {
    return this.isPremium && (!this.premiumExpiresAt || this.premiumExpiresAt > new Date());
};

guildSchema.methods.hasFeature = function(feature) {
    if (this.isPremiumActive()) {
        return true; // Premium guilds have all features
    }
    
    // Free tier restrictions
    const freeFeatures = ['moderation', 'music', 'welcome', 'tickets'];
    return freeFeatures.includes(feature);
};

guildSchema.methods.getPermissionLevel = function(userId, userRoles = []) {
    if (this.ownerId === userId) return 'owner';
    
    const adminRoles = this.moderation.adminRoles || [];
    const moderatorRoles = this.moderation.moderatorRoles || [];
    const staffRoles = this.moderation.staffRoles || [];
    
    if (userRoles.some(role => adminRoles.includes(role))) return 'admin';
    if (userRoles.some(role => moderatorRoles.includes(role))) return 'moderator';
    if (userRoles.some(role => staffRoles.includes(role))) return 'staff';
    
    return 'member';
};

module.exports = mongoose.model('Guild', guildSchema);