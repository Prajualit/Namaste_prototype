import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import logger from '../utils/logger.js';
import abhaService from './abhaService.js';

/**
 * User model for ABHA-authenticated users
 */
const User = sequelize.define('User', {
  abhaId: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
    comment: 'ABHA ID of the user'
  },
  abhaNumber: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
    comment: 'ABHA number (14-digit unique identifier)'
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    comment: 'Full name of the user'
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  mobile: {
    type: Sequelize.STRING,
    allowNull: true
  },
  gender: {
    type: Sequelize.ENUM('M', 'F', 'O'),
    allowNull: true,
    comment: 'Gender: M=Male, F=Female, O=Other'
  },
  dateOfBirth: {
    type: Sequelize.DATEONLY,
    allowNull: true
  },
  address: {
    type: Sequelize.JSON,
    allowNull: true,
    comment: 'Address information including state, district, etc.'
  },
  healthId: {
    type: Sequelize.STRING,
    allowNull: true,
    comment: 'Health ID associated with ABHA'
  },
  profile: {
    type: Sequelize.JSON,
    allowNull: true,
    comment: 'Complete ABHA profile data'
  },
  lastLogin: {
    type: Sequelize.DATE,
    allowNull: true
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['abhaNumber']
    },
    {
      fields: ['email']
    },
    {
      fields: ['mobile']
    }
  ]
});

class UserService {
  constructor() {
    this.User = User;
  }

  /**
   * Create or update user from ABHA profile
   * @param {Object} abhaProfile - ABHA profile data
   * @returns {Object} User record
   */
  async createOrUpdateUser(abhaProfile) {
    try {
      const userData = {
        abhaId: abhaProfile.abhaId || abhaProfile.sub,
        abhaNumber: abhaProfile.abhaNumber,
        name: abhaProfile.name || `${abhaProfile.firstName || ''} ${abhaProfile.lastName || ''}`.trim(),
        email: abhaProfile.email,
        mobile: abhaProfile.mobile,
        gender: abhaProfile.gender,
        dateOfBirth: abhaProfile.dateOfBirth,
        address: abhaProfile.address ? {
          state: abhaProfile.address.state,
          district: abhaProfile.address.district,
          subDistrict: abhaProfile.address.subDistrict,
          village: abhaProfile.address.village,
          town: abhaProfile.address.town,
          pincode: abhaProfile.address.pincode,
          addressLine: abhaProfile.address.addressLine
        } : null,
        healthId: abhaProfile.healthId,
        profile: abhaProfile,
        lastLogin: new Date(),
        isActive: true
      };

      const [user, created] = await this.User.upsert(userData, {
        returning: true
      });

      logger.info(`User ${created ? 'created' : 'updated'}`, {
        abhaId: user.abhaId,
        abhaNumber: user.abhaNumber,
        name: user.name
      });

      return user;
    } catch (error) {
      logger.error('Error creating/updating user:', error);
      throw new Error(`User management error: ${error.message}`);
    }
  }

  /**
   * Get user by ABHA ID
   * @param {string} abhaId - ABHA ID
   * @returns {Object|null} User record
   */
  async getUserByAbhaId(abhaId) {
    try {
      const user = await this.User.findByPk(abhaId);
      return user;
    } catch (error) {
      logger.error('Error fetching user by ABHA ID:', error);
      throw new Error(`User fetch error: ${error.message}`);
    }
  }

  /**
   * Get user by ABHA number
   * @param {string} abhaNumber - ABHA number
   * @returns {Object|null} User record
   */
  async getUserByAbhaNumber(abhaNumber) {
    try {
      const user = await this.User.findOne({
        where: { abhaNumber }
      });
      return user;
    } catch (error) {
      logger.error('Error fetching user by ABHA number:', error);
      throw new Error(`User fetch error: ${error.message}`);
    }
  }

  /**
   * Update user's last login timestamp
   * @param {string} abhaId - ABHA ID
   */
  async updateLastLogin(abhaId) {
    try {
      await this.User.update(
        { lastLogin: new Date() },
        { where: { abhaId } }
      );
    } catch (error) {
      logger.error('Error updating last login:', error);
    }
  }

  /**
   * Deactivate user account
   * @param {string} abhaId - ABHA ID
   */
  async deactivateUser(abhaId) {
    try {
      const result = await this.User.update(
        { isActive: false },
        { where: { abhaId } }
      );

      logger.info(`User deactivated: ${abhaId}`);
      return result[0] > 0;
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw new Error(`User deactivation error: ${error.message}`);
    }
  }

  /**
   * Get user statistics
   * @returns {Object} User statistics
   */
  async getUserStats() {
    try {
      const [totalUsers, activeUsers, recentLogins] = await Promise.all([
        this.User.count(),
        this.User.count({ where: { isActive: true } }),
        this.User.count({
          where: {
            lastLogin: {
              [Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ]);

      return {
        totalUsers,
        activeUsers,
        recentLogins,
        inactiveUsers: totalUsers - activeUsers
      };
    } catch (error) {
      logger.error('Error fetching user statistics:', error);
      throw new Error(`Statistics error: ${error.message}`);
    }
  }

  /**
   * Authenticate user with ABHA token
   * @param {string} token - ABHA JWT token
   * @returns {Object} User record and profile
   */
  async authenticateUser(token) {
    try {
      // Verify token with ABHA service
      const isValid = await abhaService.verifyToken(token);
      if (!isValid) {
        throw new Error('Invalid ABHA token');
      }

      // Get user profile from ABHA
      const abhaProfile = await abhaService.getUserProfile(token);
      if (!abhaProfile) {
        throw new Error('Unable to fetch user profile');
      }

      // Create or update user in local database
      const user = await this.createOrUpdateUser(abhaProfile);

      // Update last login
      await this.updateLastLogin(user.abhaId);

      return {
        user: user.toJSON(),
        profile: abhaProfile
      };
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw new Error(`Authentication error: ${error.message}`);
    }
  }

  /**
   * Initialize user service
   */
  async initialize() {
    try {
      // Create table if it doesn't exist
      await this.User.sync();
      logger.info('User service initialized');
    } catch (error) {
      logger.error('Error initializing user service:', error);
      throw error;
    }
  }

  /**
   * Get recent users
   * @param {number} limit - Number of users to fetch
   * @returns {Array} Recent users
   */
  async getRecentUsers(limit = 10) {
    try {
      const users = await this.User.findAll({
        order: [['lastLogin', 'DESC']],
        limit,
        attributes: ['abhaId', 'abhaNumber', 'name', 'email', 'lastLogin', 'isActive']
      });

      return users;
    } catch (error) {
      logger.error('Error fetching recent users:', error);
      throw new Error(`Recent users fetch error: ${error.message}`);
    }
  }

  /**
   * Search users by name or ABHA number
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @returns {Array} Search results
   */
  async searchUsers(query, limit = 20) {
    try {
      const users = await this.User.findAll({
        where: {
          [Sequelize.Op.or]: [
            { name: { [Sequelize.Op.like]: `%${query}%` } },
            { abhaNumber: { [Sequelize.Op.like]: `%${query}%` } },
            { email: { [Sequelize.Op.like]: `%${query}%` } }
          ]
        },
        limit,
        attributes: ['abhaId', 'abhaNumber', 'name', 'email', 'mobile', 'lastLogin', 'isActive'],
        order: [['name', 'ASC']]
      });

      return users;
    } catch (error) {
      logger.error('Error searching users:', error);
      throw new Error(`User search error: ${error.message}`);
    }
  }
}

export default new UserService();