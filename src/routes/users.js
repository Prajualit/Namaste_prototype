import express from 'express';
import userService from '../services/userService.js';
import abhaService from '../services/abhaService.js';
import { abhaAuth } from '../middleware/auth.js';
import { body, param, query, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation failed', 400, { errors: errors.array() });
  }
  next();
};

/**
 * @route POST /api/users/auth/login
 * @desc Authenticate user with ABHA token
 * @access Public
 */
router.post('/auth/login', [
  body('token').notEmpty().withMessage('ABHA token is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { token } = req.body;
    
    const result = await userService.authenticateUser(token);
    
    logger.info('User authenticated successfully', {
      abhaId: result.user.abhaId,
      abhaNumber: result.user.abhaNumber
    });

    successResponse(res, 'Authentication successful', {
      user: {
        abhaId: result.user.abhaId,
        abhaNumber: result.user.abhaNumber,
        name: result.user.name,
        email: result.user.email,
        mobile: result.user.mobile,
        healthId: result.user.healthId,
        lastLogin: result.user.lastLogin
      },
      token // Return the verified token for frontend use
    });
  } catch (error) {
    logger.error('Authentication failed:', error);
    errorResponse(res, error.message, 401);
  }
});

/**
 * @route GET /api/users/profile
 * @desc Get current user's profile
 * @access Private (ABHA authenticated)
 */
router.get('/profile', abhaAuth, async (req, res) => {
  try {
    const user = await userService.getUserByAbhaId(req.user.abhaId);
    
    if (!user) {
      return errorResponse(res, 'User profile not found', 404);
    }

    successResponse(res, 'Profile retrieved successfully', {
      abhaId: user.abhaId,
      abhaNumber: user.abhaNumber,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      healthId: user.healthId,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    errorResponse(res, 'Failed to fetch profile', 500);
  }
});

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private (ABHA authenticated)
 */
router.put('/profile', [
  abhaAuth,
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('mobile').optional().isMobilePhone('en-IN').withMessage('Invalid mobile number format'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, mobile } = req.body;
    const user = await userService.getUserByAbhaId(req.user.abhaId);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Update allowed fields
    const updateData = {};
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;
    
    await user.update(updateData);

    logger.info('User profile updated', {
      abhaId: req.user.abhaId,
      updatedFields: Object.keys(updateData)
    });

    successResponse(res, 'Profile updated successfully', {
      abhaId: user.abhaId,
      abhaNumber: user.abhaNumber,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    errorResponse(res, 'Failed to update profile', 500);
  }
});

/**
 * @route GET /api/users/stats
 * @desc Get user statistics (admin endpoint)
 * @access Private (ABHA authenticated)
 */
router.get('/stats', abhaAuth, async (req, res) => {
  try {
    const stats = await userService.getUserStats();
    
    successResponse(res, 'User statistics retrieved successfully', stats);
  } catch (error) {
    logger.error('Error fetching user statistics:', error);
    errorResponse(res, 'Failed to fetch statistics', 500);
  }
});

/**
 * @route GET /api/users/recent
 * @desc Get recent users (admin endpoint)
 * @access Private (ABHA authenticated)
 */
router.get('/recent', [
  abhaAuth,
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const users = await userService.getRecentUsers(limit);
    
    successResponse(res, 'Recent users retrieved successfully', {
      users: users.map(user => ({
        abhaId: user.abhaId,
        abhaNumber: user.abhaNumber,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin,
        isActive: user.isActive
      }))
    });
  } catch (error) {
    logger.error('Error fetching recent users:', error);
    errorResponse(res, 'Failed to fetch recent users', 500);
  }
});

/**
 * @route GET /api/users/search
 * @desc Search users by name or ABHA number
 * @access Private (ABHA authenticated)
 */
router.get('/search', [
  abhaAuth,
  query('q').notEmpty().withMessage('Search query is required'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;
    const users = await userService.searchUsers(query, parseInt(limit));
    
    successResponse(res, 'User search completed successfully', {
      query,
      count: users.length,
      users: users.map(user => ({
        abhaId: user.abhaId,
        abhaNumber: user.abhaNumber,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        lastLogin: user.lastLogin,
        isActive: user.isActive
      }))
    });
  } catch (error) {
    logger.error('Error searching users:', error);
    errorResponse(res, 'User search failed', 500);
  }
});

/**
 * @route POST /api/users/:abhaId/deactivate
 * @desc Deactivate a user account (admin endpoint)
 * @access Private (ABHA authenticated)
 */
router.post('/:abhaId/deactivate', [
  abhaAuth,
  param('abhaId').notEmpty().withMessage('ABHA ID is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { abhaId } = req.params;
    
    // Prevent self-deactivation
    if (abhaId === req.user.abhaId) {
      return errorResponse(res, 'Cannot deactivate your own account', 400);
    }
    
    const result = await userService.deactivateUser(abhaId);
    
    if (!result) {
      return errorResponse(res, 'User not found or already inactive', 404);
    }

    logger.info('User deactivated', {
      abhaId,
      deactivatedBy: req.user.abhaId
    });

    successResponse(res, 'User account deactivated successfully');
  } catch (error) {
    logger.error('Error deactivating user:', error);
    errorResponse(res, 'Failed to deactivate user', 500);
  }
});

/**
 * @route POST /api/users/token/verify
 * @desc Verify ABHA token validity
 * @access Public
 */
router.post('/token/verify', [
  body('token').notEmpty().withMessage('Token is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { token } = req.body;
    
    const isValid = await abhaService.verifyToken(token);
    
    if (isValid) {
      const profile = await abhaService.getUserProfile(token);
      successResponse(res, 'Token is valid', {
        valid: true,
        profile: profile ? {
          abhaId: profile.abhaId || profile.sub,
          abhaNumber: profile.abhaNumber,
          name: profile.name,
          email: profile.email
        } : null
      });
    } else {
      successResponse(res, 'Token is invalid', { valid: false });
    }
  } catch (error) {
    logger.error('Error verifying token:', error);
    errorResponse(res, 'Token verification failed', 500);
  }
});

/**
 * @route GET /api/users/health
 * @desc Health check for user service
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await userService.getUserStats();
    
    successResponse(res, 'User service is healthy', {
      service: 'UserService',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      userStats: stats
    });
  } catch (error) {
    logger.error('User service health check failed:', error);
    errorResponse(res, 'User service is unhealthy', 503, {
      service: 'UserService',
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;