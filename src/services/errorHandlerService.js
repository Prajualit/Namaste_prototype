import logger from '../utils/logger.js';

/**
 * Centralized error handling service for ABHA operations
 */
class ErrorHandlerService {
  constructor() {
    this.errorCodes = {
      // ABHA Authentication Errors
      ABHA_TOKEN_INVALID: 'ABHA_TOKEN_INVALID',
      ABHA_TOKEN_EXPIRED: 'ABHA_TOKEN_EXPIRED',
      ABHA_TOKEN_MALFORMED: 'ABHA_TOKEN_MALFORMED',
      ABHA_PROFILE_FETCH_FAILED: 'ABHA_PROFILE_FETCH_FAILED',
      ABHA_KEY_FETCH_FAILED: 'ABHA_KEY_FETCH_FAILED',
      ABHA_SERVICE_UNAVAILABLE: 'ABHA_SERVICE_UNAVAILABLE',
      
      // User Management Errors
      USER_NOT_FOUND: 'USER_NOT_FOUND',
      USER_CREATION_FAILED: 'USER_CREATION_FAILED',
      USER_UPDATE_FAILED: 'USER_UPDATE_FAILED',
      USER_DEACTIVATION_FAILED: 'USER_DEACTIVATION_FAILED',
      
      // Database Errors
      DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
      DATABASE_QUERY_FAILED: 'DATABASE_QUERY_FAILED',
      DATABASE_TRANSACTION_FAILED: 'DATABASE_TRANSACTION_FAILED',
      
      // API Errors
      INVALID_REQUEST_DATA: 'INVALID_REQUEST_DATA',
      MISSING_REQUIRED_PARAMETER: 'MISSING_REQUIRED_PARAMETER',
      RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
      UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
      
      // External Service Errors
      EXTERNAL_API_TIMEOUT: 'EXTERNAL_API_TIMEOUT',
      EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
      NETWORK_ERROR: 'NETWORK_ERROR'
    };
    
    this.errorMessages = {
      [this.errorCodes.ABHA_TOKEN_INVALID]: 'The provided ABHA token is invalid',
      [this.errorCodes.ABHA_TOKEN_EXPIRED]: 'The ABHA token has expired',
      [this.errorCodes.ABHA_TOKEN_MALFORMED]: 'The ABHA token format is incorrect',
      [this.errorCodes.ABHA_PROFILE_FETCH_FAILED]: 'Failed to fetch ABHA user profile',
      [this.errorCodes.ABHA_KEY_FETCH_FAILED]: 'Failed to fetch ABHA public keys',
      [this.errorCodes.ABHA_SERVICE_UNAVAILABLE]: 'ABHA service is currently unavailable',
      
      [this.errorCodes.USER_NOT_FOUND]: 'User not found',
      [this.errorCodes.USER_CREATION_FAILED]: 'Failed to create user account',
      [this.errorCodes.USER_UPDATE_FAILED]: 'Failed to update user information',
      [this.errorCodes.USER_DEACTIVATION_FAILED]: 'Failed to deactivate user account',
      
      [this.errorCodes.DATABASE_CONNECTION_FAILED]: 'Database connection failed',
      [this.errorCodes.DATABASE_QUERY_FAILED]: 'Database query execution failed',
      [this.errorCodes.DATABASE_TRANSACTION_FAILED]: 'Database transaction failed',
      
      [this.errorCodes.INVALID_REQUEST_DATA]: 'Invalid request data provided',
      [this.errorCodes.MISSING_REQUIRED_PARAMETER]: 'Required parameter is missing',
      [this.errorCodes.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
      [this.errorCodes.UNAUTHORIZED_ACCESS]: 'Unauthorized access attempt',
      
      [this.errorCodes.EXTERNAL_API_TIMEOUT]: 'External API request timed out',
      [this.errorCodes.EXTERNAL_API_ERROR]: 'External API returned an error',
      [this.errorCodes.NETWORK_ERROR]: 'Network connection error'
    };
  }

  /**
   * Create a standardized error object
   * @param {string} code - Error code
   * @param {string} message - Error message (optional)
   * @param {Object} details - Additional error details
   * @param {Error} originalError - Original error object
   * @returns {Object} Standardized error
   */
  createError(code, message = null, details = {}, originalError = null) {
    const error = new Error(message || this.errorMessages[code] || 'Unknown error');
    error.code = code;
    error.details = details;
    error.timestamp = new Date().toISOString();
    
    if (originalError) {
      error.originalError = {
        message: originalError.message,
        stack: originalError.stack,
        name: originalError.name
      };
    }
    
    return error;
  }

  /**
   * Handle ABHA authentication errors
   * @param {Error} error - Original error
   * @param {Object} context - Error context
   * @returns {Object} Standardized error response
   */
  handleAbhaAuthError(error, context = {}) {
    let errorCode = this.errorCodes.ABHA_TOKEN_INVALID;
    let statusCode = 401;
    
    // Determine specific error type
    if (error.message.includes('expired') || error.name === 'TokenExpiredError') {
      errorCode = this.errorCodes.ABHA_TOKEN_EXPIRED;
    } else if (error.message.includes('malformed') || error.name === 'JsonWebTokenError') {
      errorCode = this.errorCodes.ABHA_TOKEN_MALFORMED;
    } else if (error.message.includes('profile')) {
      errorCode = this.errorCodes.ABHA_PROFILE_FETCH_FAILED;
      statusCode = 502;
    } else if (error.message.includes('keys') || error.message.includes('JWKS')) {
      errorCode = this.errorCodes.ABHA_KEY_FETCH_FAILED;
      statusCode = 502;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorCode = this.errorCodes.ABHA_SERVICE_UNAVAILABLE;
      statusCode = 503;
    }
    
    const standardError = this.createError(errorCode, null, context, error);
    
    // Log the error with ABHA-specific context
    logger.abhaError('ABHA authentication error', error, {
      errorCode,
      abhaId: context.abhaId,
      operation: context.operation,
      userAgent: context.userAgent,
      ip: context.ip
    });
    
    return {
      error: standardError,
      statusCode,
      response: {
        success: false,
        message: standardError.message,
        code: errorCode,
        timestamp: standardError.timestamp
      }
    };
  }

  /**
   * Handle database errors
   * @param {Error} error - Original error
   * @param {Object} context - Error context
   * @returns {Object} Standardized error response
   */
  handleDatabaseError(error, context = {}) {
    let errorCode = this.errorCodes.DATABASE_QUERY_FAILED;
    let statusCode = 500;
    
    if (error.name === 'SequelizeConnectionError') {
      errorCode = this.errorCodes.DATABASE_CONNECTION_FAILED;
      statusCode = 503;
    } else if (error.name === 'SequelizeValidationError') {
      errorCode = this.errorCodes.INVALID_REQUEST_DATA;
      statusCode = 400;
    } else if (error.name === 'SequelizeTransactionError') {
      errorCode = this.errorCodes.DATABASE_TRANSACTION_FAILED;
    }
    
    const standardError = this.createError(errorCode, null, context, error);
    
    logger.error('Database error', {
      errorCode,
      errorName: error.name,
      operation: context.operation,
      table: context.table,
      query: context.query
    });
    
    return {
      error: standardError,
      statusCode,
      response: {
        success: false,
        message: statusCode === 500 ? 'Internal server error' : standardError.message,
        code: errorCode,
        timestamp: standardError.timestamp
      }
    };
  }

  /**
   * Handle user management errors
   * @param {Error} error - Original error
   * @param {Object} context - Error context
   * @returns {Object} Standardized error response
   */
  handleUserError(error, context = {}) {
    let errorCode = this.errorCodes.USER_CREATION_FAILED;
    let statusCode = 500;
    
    if (context.operation === 'fetch' || context.operation === 'find') {
      errorCode = this.errorCodes.USER_NOT_FOUND;
      statusCode = 404;
    } else if (context.operation === 'update') {
      errorCode = this.errorCodes.USER_UPDATE_FAILED;
    } else if (context.operation === 'deactivate') {
      errorCode = this.errorCodes.USER_DEACTIVATION_FAILED;
    }
    
    const standardError = this.createError(errorCode, null, context, error);
    
    logger.error('User management error', {
      errorCode,
      operation: context.operation,
      abhaId: context.abhaId,
      abhaNumber: context.abhaNumber
    });
    
    return {
      error: standardError,
      statusCode,
      response: {
        success: false,
        message: standardError.message,
        code: errorCode,
        timestamp: standardError.timestamp
      }
    };
  }

  /**
   * Handle external API errors
   * @param {Error} error - Original error
   * @param {Object} context - Error context
   * @returns {Object} Standardized error response
   */
  handleExternalApiError(error, context = {}) {
    let errorCode = this.errorCodes.EXTERNAL_API_ERROR;
    let statusCode = 502;
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      errorCode = this.errorCodes.EXTERNAL_API_TIMEOUT;
      statusCode = 504;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorCode = this.errorCodes.NETWORK_ERROR;
      statusCode = 503;
    }
    
    const standardError = this.createError(errorCode, null, context, error);
    
    logger.error('External API error', {
      errorCode,
      apiEndpoint: context.endpoint,
      httpMethod: context.method,
      httpStatus: context.status,
      responseTime: context.responseTime
    });
    
    return {
      error: standardError,
      statusCode,
      response: {
        success: false,
        message: 'External service error',
        code: errorCode,
        timestamp: standardError.timestamp
      }
    };
  }

  /**
   * Handle validation errors
   * @param {Array} validationErrors - Express-validator errors
   * @param {Object} context - Error context
   * @returns {Object} Standardized error response
   */
  handleValidationError(validationErrors, context = {}) {
    const errorCode = this.errorCodes.INVALID_REQUEST_DATA;
    
    const details = {
      fields: validationErrors.map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    };
    
    const standardError = this.createError(errorCode, 'Request validation failed', details);
    
    logger.warn('Validation error', {
      errorCode,
      validationErrors: details.fields,
      endpoint: context.endpoint,
      method: context.method
    });
    
    return {
      error: standardError,
      statusCode: 400,
      response: {
        success: false,
        message: standardError.message,
        code: errorCode,
        errors: details.fields,
        timestamp: standardError.timestamp
      }
    };
  }

  /**
   * Handle security-related errors
   * @param {string} securityEvent - Type of security event
   * @param {Object} context - Security context
   * @returns {Object} Standardized error response
   */
  handleSecurityError(securityEvent, context = {}) {
    const errorCode = this.errorCodes.UNAUTHORIZED_ACCESS;
    const standardError = this.createError(errorCode, 'Access denied');
    
    logger.security(`Security event: ${securityEvent}`, {
      event: securityEvent,
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      abhaId: context.abhaId,
      timestamp: new Date().toISOString()
    });
    
    return {
      error: standardError,
      statusCode: 403,
      response: {
        success: false,
        message: 'Access denied',
        code: errorCode,
        timestamp: standardError.timestamp
      }
    };
  }

  /**
   * Log error metrics for monitoring
   * @param {string} errorCode - Error code
   * @param {Object} context - Error context
   */
  logErrorMetrics(errorCode, context = {}) {
    logger.info('Error metrics', {
      metric: 'error_count',
      errorCode,
      service: context.service || 'unknown',
      endpoint: context.endpoint,
      abhaOperation: context.abhaOperation,
      timestamp: new Date().toISOString()
    });
  }
}

export default new ErrorHandlerService();