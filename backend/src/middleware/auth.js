const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'kisanmitra-dev-secret';

/**
 * Authentication Middleware
 * Validates the JWT and fetches the user from the database.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user without password field; supports decoded.id or decoded._id
    const userId = decoded.id || decoded._id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: user not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token expired or invalid.',
      error: error.message
    });
  }
};

/**
 * Dynamic Role Authorization Middleware
 * Usage: authorize('Admin', 'Super Admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You do not have permission to access this resource.'
    });
  }

  next();
};

/**
 * Dedicated Admin & Super Admin Middleware
 */
const requireSuperAdmin = authorize('Super Admin', 'Admin');

module.exports = {
  // Primary combined methods
  authenticate,
  authorize,
  requireSuperAdmin,

  // Aliases for compatibility with both versions
  verifyToken: authenticate
};