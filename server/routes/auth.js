const express = require('express');
const passport = require('passport');
const router = express.Router();

// Discord OAuth login
router.get('/discord', passport.authenticate('discord'));

// Discord OAuth callback
router.get('/discord/callback', 
    passport.authenticate('discord', { 
        failureRedirect: '/login?error=auth_failed' 
    }),
    (req, res) => {
        // Successful authentication
        const redirectUrl = req.session.returnTo || '/dashboard';
        delete req.session.returnTo;
        res.redirect(redirectUrl);
    }
);

// Get current user
router.get('/me', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
        id: req.user.discordId,
        username: req.user.username,
        discriminator: req.user.discriminator,
        avatar: req.user.avatar,
        email: req.user.email,
        isPremium: req.user.isPremiumActive(),
        premiumTier: req.user.premiumTier,
        isAdmin: req.user.isAdmin,
        isStaff: req.user.isStaff,
        ageVerified: req.user.ageVerified,
        joinedAt: req.user.joinedAt,
        preferences: req.user.preferences,
        stats: req.user.stats
    });
});

// Update user preferences
router.put('/preferences', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const allowedFields = ['theme', 'language', 'notifications', 'privacy'];
        const updates = {};
        
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updates[`preferences.${key}`] = req.body[key];
            }
        });

        req.user.updateOne(updates);
        res.json({ message: 'Preferences updated successfully' });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Session destruction failed' });
            }
            res.clearCookie('connect.sid');
            res.json({ message: 'Logged out successfully' });
        });
    });
});

// Check authentication status
router.get('/status', (req, res) => {
    res.json({
        authenticated: !!req.user,
        user: req.user ? {
            id: req.user.discordId,
            username: req.user.username,
            avatar: req.user.avatar,
            isPremium: req.user.isPremiumActive(),
            isAdmin: req.user.isAdmin
        } : null
    });
});

module.exports = router;