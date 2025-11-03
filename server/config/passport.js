const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
    passport.use(new DiscordStrategy({
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: process.env.DISCORD_CALLBACK_URL || '/api/auth/discord/callback',
        scope: ['identify', 'guilds', 'guilds.members.read']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ discordId: profile.id });

            if (user) {
                // Update existing user
                user.username = profile.username;
                user.discriminator = profile.discriminator;
                user.avatar = profile.avatar;
                user.accessToken = accessToken;
                user.refreshToken = refreshToken;
                user.lastLogin = new Date();
                await user.save();
            } else {
                // Create new user
                user = new User({
                    discordId: profile.id,
                    username: profile.username,
                    discriminator: profile.discriminator,
                    email: profile.email,
                    avatar: profile.avatar,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    isVerified: false,
                    isPremium: false,
                    isAdmin: false,
                    ageVerified: false,
                    joinedAt: new Date(),
                    lastLogin: new Date()
                });
                await user.save();
            }

            return done(null, user);
        } catch (error) {
            console.error('Passport Discord Strategy Error:', error);
            return done(error, null);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};