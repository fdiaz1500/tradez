const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const ApiError = require('../utils/ApiError');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 * Now optional - attaches demo user if no token is provided
 */
exports.authenticate = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    let token;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      // Alternative: Get token from cookie
      token = req.cookies.token;
    }

    // If no token is provided, use demo user
    if (!token) {
      const { db } = req.app.locals;
      const demoUserResult = await db.query(
        'SELECT id, email, role, is_active FROM users WHERE email = $1',
        ['demo@example.com']
      );
      
      if (demoUserResult.rows.length > 0) {
        req.user = demoUserResult.rows[0];
        req.isDemoUser = true;
        return next();
      } else {
        // If demo user doesn't exist, just create a generic user object
        req.user = {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'demo@example.com',
          role: 'user',
          is_active: true
        };
        req.isDemoUser = true;
        return next();
      }
    }

    // 2. Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const { db } = req.app.locals;
    const result = await db.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return next(new ApiError('User no longer exists', 401));
    }
    
    if (!user.is_active) {
      return next(new ApiError('User account is disabled', 401));
    }

    // 4. Check if token is in active sessions
    const sessionResult = await db.query(
      'SELECT id FROM sessions WHERE user_id = $1 AND token = $2 AND expires_at > NOW()',
      [user.id, token]
    );
    
    if (sessionResult.rows.length === 0) {
      return next(new ApiError('Session expired, please log in again', 401));
    }

    // 5. Grant access to protected route
    req.user = user;
    req.sessionId = sessionResult.rows[0].id;
    req.isDemoUser = false;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError('Invalid token', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError('Token expired', 401));
    }
    next(err);
  }
};

/**
 * Authorization middleware
 * Restricts access to specified roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('You do not have permission to perform this action', 403)
      );
    }
    
    next();
  };
};

/**
 * Generate JWT token
 */
exports.generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

/**
 * Create a new session
 */
exports.createSession = async (db, userId, token, ipAddress, userAgent) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 1); // 1 day from now
  
  const result = await db.query(
    `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id`,
    [userId, token, ipAddress, userAgent, expiresAt]
  );
  
  return result.rows[0].id;
};

