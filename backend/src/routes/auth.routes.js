const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { generateToken, createSession } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  [
    // Validation middleware
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain a number')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required')
  ],
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName } = req.body;
      const { db } = req.app.locals;

      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return next(new ApiError('User with this email already exists', 409));
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userResult = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, first_name, last_name, role, created_at`,
        [email.toLowerCase(), passwordHash, firstName, lastName]
      );

      const user = userResult.rows[0];

      // Create default wallets (BTC, ETH, USDT)
      await Promise.all([
        db.query(
          'INSERT INTO wallets (user_id, currency, balance) VALUES ($1, $2, $3)',
          [user.id, 'BTC', 0]
        ),
        db.query(
          'INSERT INTO wallets (user_id, currency, balance) VALUES ($1, $2, $3)',
          [user.id, 'ETH', 0]
        ),
        db.query(
          'INSERT INTO wallets (user_id, currency, balance) VALUES ($1, $2, $3)',
          [user.id, 'USDT', 0]
        )
      ]);

      // Generate token
      const token = generateToken(user.id);

      // Create session
      await createSession(
        db,
        user.id,
        token,
        req.ip,
        req.headers['user-agent']
      );

      // Set cookie in secure environments
      if (process.env.NODE_ENV === 'production') {
        res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
      }

      // Send response
      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at
        },
        token
      });
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const { db } = req.app.locals;

      // Find user
      const userResult = await db.query(
        `SELECT id, email, password_hash, first_name, last_name, role, is_active
         FROM users WHERE email = $1`,
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return next(new ApiError('Invalid email or password', 401));
      }

      const user = userResult.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return next(new ApiError('Your account has been deactivated', 401));
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        return next(new ApiError('Invalid email or password', 401));
      }

      // Generate token
      const token = generateToken(user.id);

      // Create session
      await createSession(
        db,
        user.id,
        token,
        req.ip,
        req.headers['user-agent']
      );

      // Set cookie in secure environments
      if (process.env.NODE_ENV === 'production') {
        res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
      }

      // Send response
      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        token
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Public
 */
router.post('/logout', async (req, res, next) => {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    let token;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const { db } = req.app.locals;
      
      // Invalidate session
      await db.query(
        'UPDATE sessions SET expires_at = NOW() WHERE token = $1',
        [token]
      );
    }

    // Clear cookie
    res.clearCookie('token');

    res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
});

module.exports = router;


