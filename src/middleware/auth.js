import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import abhaService from '../services/abhaService.js';
import logger from '../utils/logger.js';
import errorHandler from '../services/errorHandlerService.js';
import { errorResponse } from '../utils/response.js';

// ABHA authentication middleware
export const abhaAuth = async (req, res, next) => {
  const startTime = Date.now();
  const clientInfo = {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    endpoint: req.path,
    method: req.method
  };

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    const errorResult = errorHandler.handleSecurityError('missing_auth_header', clientInfo);
    logger.abhaAuth('Authentication failed: Missing authorization header', clientInfo);
    
    return res.status(errorResult.statusCode).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'security',
        details: {
          text: errorResult.response.message
        }
      }]
    });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    const errorResult = errorHandler.handleSecurityError('missing_bearer_token', clientInfo);
    logger.abhaAuth('Authentication failed: Missing bearer token', clientInfo);
    
    return res.status(errorResult.statusCode).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'security',
        details: {
          text: errorResult.response.message
        }
      }]
    });
  }

  try {
    // Demo mode bypass for development
    if (process.env.DEMO_MODE === 'true') {
      if (token === 'demo-token-12345' || token.startsWith('demo-')) {
        // Use demo user from ABHA service
        req.user = abhaService.createDemoUser();
        const processingTime = Date.now() - startTime;
        
        logger.abhaAuth('Demo authentication successful', { 
          userId: req.user.id,
          processingTime,
          ...clientInfo
        });
        return next();
      }
    }

    // Production ABHA authentication
    logger.abhaAuth('Starting ABHA token verification', clientInfo);
    
    // Verify the JWT token using ABHA service
    const tokenPayload = await abhaService.verifyToken(token);
    
    // Get user profile from ABHA
    const userProfile = await abhaService.getUserProfile(
      tokenPayload.abha_number, 
      token
    );
    
    // Attach user info to request
    req.user = userProfile;
    req.token = token;
    req.tokenPayload = tokenPayload;
    
    const processingTime = Date.now() - startTime;
    
    logger.abhaAuth('ABHA authentication successful', { 
      abhaId: userProfile.abhaId,
      userId: userProfile.id,
      processingTime,
      ...clientInfo
    });
    
    next();
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const context = {
      operation: 'authentication',
      processingTime,
      ...clientInfo
    };
    
    // Handle different types of authentication errors
    const errorResult = errorHandler.handleAbhaAuthError(error, context);
    
    logger.abhaAuth('ABHA authentication failed', {
      error: error.message,
      errorCode: errorResult.error.code,
      processingTime,
      ...clientInfo
    });
    
    // Log security metrics
    errorHandler.logErrorMetrics(errorResult.error.code, {
      service: 'authentication',
      endpoint: req.path,
      abhaOperation: 'token_verification'
    });
    
    return res.status(errorResult.statusCode).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'security',
        details: {
          text: errorResult.response.message
        }
      }]
    });
  }
};

// Rate limiting middleware for authentication endpoints
export const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const clientKey = req.ip + ':' + req.get('User-Agent');
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(key);
      }
    }
    
    // Check current client attempts
    const clientAttempts = attempts.get(clientKey);
    
    if (!clientAttempts) {
      attempts.set(clientKey, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }
    
    if (clientAttempts.count >= maxAttempts) {
      const errorResult = errorHandler.handleSecurityError('rate_limit_exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        attempts: clientAttempts.count
      });
      
      return res.status(429).json(errorResult.response);
    }
    
    clientAttempts.count++;
    next();
  };
};

// Legacy mock auth function for backward compatibility
export const mockAuth = abhaAuth;
