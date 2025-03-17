const express = require('express');
const { body, validationResult } = require('express-validator');
const { authorize } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/users/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', async (req, res, next) => {
  try {
    const { db } = req.app.locals;
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return next(new ApiError('User not found', 404));
    }

    const user = result.rows[0];

    res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    next(error);
  }
});

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put(
  '/profile',
  [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email')
  ],
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email } = req.body;
      const userId = req.user.id;
      const { db } = req.app.locals;

      // Build update query dynamically based on provided fields
      const updateFields = [];
      const queryParams = [];
      let paramCounter = 1;

      if (firstName !== undefined) {
        updateFields.push(`first_name = $${paramCounter++}`);
        queryParams.push(firstName);
      }

      if (lastName !== undefined) {
        updateFields.push(`last_name = $${paramCounter++}`);
        queryParams.push(lastName);
      }

      if (email !== undefined) {
        // Check if email is already taken
        const existingUser = await db.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email.toLowerCase(), userId]
        );

        if (existingUser.rows.length > 0) {
          return next(new ApiError('Email is already in use', 409));
        }

        updateFields.push(`email = $${paramCounter++}`);
        queryParams.push(email.toLowerCase());
      }

      // Add updated_at field
      updateFields.push(`updated_at = NOW()`);

      // If no fields to update
      if (updateFields.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No valid fields to update'
        });
      }

      // Add userId to params
      queryParams.push(userId);

      // Execute update query
      const result = await db.query(
        `UPDATE users
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCounter}
         RETURNING id, email, first_name, last_name, role, created_at, updated_at`,
        queryParams
      );

      if (result.rows.length === 0) {
        return next(new ApiError('User not found', 404));
      }

      const user = result.rows[0];

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    }
  }
);

/**
 * @route PUT /api/users/password
 * @desc Update user password
 * @access Private
 */
router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain a number')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter')
  ],
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      const { db } = req.app.locals;
      
      // Get current user with password
      const userResult = await db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return next(new ApiError('User not found', 404));
      }

      const user = userResult.rows[0];

      // Verify current password
      const bcrypt = require('bcrypt');
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password_hash
      );

      if (!isPasswordValid) {
        return next(new ApiError('Current password is incorrect', 401));
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, userId]
      );

      res.status(200).json({
        status: 'success',
        message: 'Password updated successfully'
      });
    } catch (error) {
      logger.error('Update password error:', error);
      next(error);
    }
  }
);

/**
 * @route DELETE /api/users
 * @desc Delete current user account
 * @access Private
 */
router.delete('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { db } = req.app.locals;

    // Delete user (this will cascade to wallets and sessions because of foreign key constraints)
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      return next(new ApiError('User not found', 404));
    }

    // Clear authentication cookie
    res.clearCookie('token');

    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error('Delete account error:', error);
    next(error);
  }
});

/**
 * Admin routes (require admin role)
 */

/**
 * @route GET /api/users
 * @desc Get all users (admin only)
 * @access Admin only
 */
router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const { db } = req.app.locals;
    
    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Get users
    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get total count
    const countResult = await db.query('SELECT COUNT(*) FROM users');
    const totalCount = parseInt(countResult.rows[0].count);

    res.status(200).json({
      status: 'success',
      data: {
        users: result.rows.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    next(error);
  }
});

module.exports = router;

