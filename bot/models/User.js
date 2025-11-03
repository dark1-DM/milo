const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    experience: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    balance: {
        type: Number,
        default: 0
    },
    lastDaily: {
        type: Date,
        default: null
    },
    warnings: [{
        id: String,
        reason: String,
        moderator: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    infractions: [{
        type: {
            type: String,
            enum: ['warn', 'mute', 'kick', 'ban']
        },
        reason: String,
        moderator: String,
        duration: String,
        date: {
            type: Date,
            default: Date.now
        },
        active: {
            type: Boolean,
            default: true
        }
    }],
    stats: {
        messagessent: {
            type: Number,
            default: 0
        },
        commandsUsed: {
            type: Number,
            default: 0
        },
        voiceTime: {
            type: Number,
            default: 0
        },
        joinDate: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});

// Compound index for userId and guildId
userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);