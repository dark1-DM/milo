const premiumMiddleware = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Authentication required.' 
      });
    }
    
    // Check if user has premium subscription
    const hasValidPremium = req.user.subscription && 
                           req.user.subscription.status === 'active' &&
                           req.user.subscription.plan !== 'free' &&
                           new Date(req.user.subscription.expiresAt) > new Date();
    
    if (!hasValidPremium) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Premium subscription required.',
        requiresPremium: true
      });
    }
    
    next();
  } catch (error) {
    console.error('Premium middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error in premium middleware.' 
    });
  }
};

module.exports = premiumMiddleware;