const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to check if user has permission for guild
const checkGuildPermission = (req, res, next) => {
    const { guildId } = req.params;
    const userGuilds = req.user.guilds || [];

    const hasPermission = userGuilds.some(guild => guild.id === guildId);

    if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions for this guild' });
    }

    next();
};

module.exports = {
    verifyToken,
    checkGuildPermission
};