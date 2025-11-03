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
    prefix: {
        type: String,
        default: '!'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    moderation: {
        enabled: {
            type: Boolean,
            default: true
        },
        logChannelId: String,
        muteRoleId: String,
        autoMod: {
            enabled: {
                type: Boolean,
                default: false
            },
            spamLimit: {
                type: Number,
                default: 5
            },
            capsLimit: {
                type: Number,
                default: 70
            },
            punishment: {
                type: String,
                enum: ['warn', 'mute', 'kick', 'ban'],
                default: 'warn'
            }
        },
        badWords: [String]
    },
    welcome: {
        enabled: {
            type: Boolean,
            default: false
        },
        channelId: String,
        message: {
            type: String,
            default: 'Welcome {user} to {server}!'
        }
    },
    goodbye: {
        enabled: {
            type: Boolean,
            default: false
        },
        channelId: String,
        message: {
            type: String,
            default: 'Goodbye {user}!'
        }
    },
    music: {
        djRoleId: String,
        maxQueueSize: {
            type: Number,
            default: 100
        },
        defaultVolume: {
            type: Number,
            default: 50
        }
    },
    reactionRoles: [{
        messageId: String,
        channelId: String,
        roles: [{
            emoji: String,
            roleId: String
        }]
    }],
    economy: {
        enabled: {
            type: Boolean,
            default: false
        },
        currency: {
            type: String,
            default: 'coins'
        },
        dailyAmount: {
            type: Number,
            default: 100
        }
    },
    leveling: {
        enabled: {
            type: Boolean,
            default: false
        },
        channelId: String,
        messageFormat: {
            type: String,
            default: 'Congratulations {user}! You reached level {level}!'
        }
    },
    settings: {
        language: {
            type: String,
            default: 'en'
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Guild', guildSchema);