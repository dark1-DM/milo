const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    discriminator: {
        type: String,
        required: true
    },
    email: String,
    avatar: String,
    accessToken: String,
    refreshToken: String,
    
    // Verification & Access
    isVerified: {
        type: Boolean,
        default: false
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isStaff: {
        type: Boolean,
        default: false
    },
    ageVerified: {
        type: Boolean,
        default: false
    },
    ageVerificationMethod: {
        type: String,
        enum: ['reaction', 'manual', 'id_upload', 'third_party'],
        default: null
    },
    ageVerifiedAt: Date,
    ageVerifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Premium & Billing
    premiumTier: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free'
    },
    premiumExpiresAt: Date,
    stripeCustomerId: String,
    subscriptionId: String,
    
    // Profile & Activity
    joinedAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: Date,
    lastActivity: Date,
    loginCount: {
        type: Number,
        default: 0
    },
    
    // Preferences
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'dark'
        },
        language: {
            type: String,
            default: 'en'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            discord: {
                type: Boolean,
                default: true
            },
            marketing: {
                type: Boolean,
                default: false
            }
        },
        privacy: {
            showOnline: {
                type: Boolean,
                default: true
            },
            showStats: {
                type: Boolean,
                default: true
            }
        }
    },
    
    // Moderation & Security
    isBanned: {
        type: Boolean,
        default: false
    },
    bannedAt: Date,
    bannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    banReason: String,
    warnings: [{
        reason: String,
        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        issuedAt: {
            type: Date,
            default: Date.now
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        }
    }],
    
    // Statistics
    stats: {
        dashboardLogins: {
            type: Number,
            default: 0
        },
        serversManaged: {
            type: Number,
            default: 0
        },
        ticketsCreated: {
            type: Number,
            default: 0
        },
        timeSpent: {
            type: Number,
            default: 0 // in minutes
        }
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ discordId: 1 });
userSchema.index({ isPremium: 1 });
userSchema.index({ isAdmin: 1 });
userSchema.index({ ageVerified: 1 });
userSchema.index({ stripeCustomerId: 1 });

// Methods
userSchema.methods.isPremiumActive = function() {
    return this.isPremium && (!this.premiumExpiresAt || this.premiumExpiresAt > new Date());
};

userSchema.methods.canAccessNSFW = function() {
    return this.ageVerified && !this.isBanned;
};

userSchema.methods.getDisplayName = function() {
    return this.discriminator === '0' ? this.username : `${this.username}#${this.discriminator}`;
};

userSchema.methods.getAvatarURL = function(size = 128) {
    if (this.avatar) {
        return `https://cdn.discordapp.com/avatars/${this.discordId}/${this.avatar}.${this.avatar.startsWith('a_') ? 'gif' : 'png'}?size=${size}`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(this.discordId) % 5}.png`;
};

// Virtual for premium status
userSchema.virtual('premiumStatus').get(function() {
    if (!this.isPremium) return 'Free';
    if (!this.premiumExpiresAt || this.premiumExpiresAt > new Date()) {
        return this.premiumTier.charAt(0).toUpperCase() + this.premiumTier.slice(1);
    }
    return 'Expired';
});

module.exports = mongoose.model('User', userSchema);