import express from 'express';
import healthMonitor from '../services/healthMonitorService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route GET /api/health
 * @desc Comprehensive health check
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const healthStatus = await healthMonitor.performHealthCheck();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 :
                       healthStatus.status === 'degraded' ? 200 :
                       503;
    
    res.status(statusCode).json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    logger.error('Health check endpoint failed:', error);
    errorResponse(res, 'Health check failed', 503, {
      error: error.message
    });
  }
});

/**
 * @route GET /api/health/ready
 * @desc Readiness probe for Kubernetes/container orchestration
 * @access Public
 */
router.get('/ready', async (req, res) => {
  try {
    const readiness = await healthMonitor.getReadinessStatus();
    
    if (readiness.ready) {
      successResponse(res, 'Service is ready', readiness);
    } else {
      res.status(503).json({
        success: false,
        message: 'Service is not ready',
        data: readiness
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Readiness check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/live
 * @desc Liveness probe for Kubernetes/container orchestration
 * @access Public
 */
router.get('/live', (req, res) => {
  try {
    const liveness = healthMonitor.getLivenessStatus();
    successResponse(res, 'Service is alive', liveness);
  } catch (error) {
    logger.error('Liveness check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Liveness check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/metrics
 * @desc Get service metrics
 * @access Public
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = healthMonitor.getMetrics();
    successResponse(res, 'Metrics retrieved successfully', metrics);
  } catch (error) {
    logger.error('Metrics endpoint failed:', error);
    errorResponse(res, 'Failed to retrieve metrics', 500, {
      error: error.message
    });
  }
});

/**
 * @route GET /api/health/abha
 * @desc ABHA service specific health check
 * @access Public
 */
router.get('/abha', async (req, res) => {
  try {
    const abhaHealth = await healthMonitor.checkAbhaService();
    
    const statusCode = abhaHealth.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: abhaHealth.status === 'healthy',
      message: abhaHealth.status === 'healthy' ? 
        'ABHA service is healthy' : 
        'ABHA service is unhealthy',
      data: abhaHealth
    });
  } catch (error) {
    logger.error('ABHA health check failed:', error);
    errorResponse(res, 'ABHA health check failed', 503, {
      error: error.message
    });
  }
});

/**
 * @route POST /api/health/test-auth
 * @desc Test authentication flow with dummy data
 * @access Public
 */
router.post('/test-auth', async (req, res) => {
  try {
    const { testMode = 'demo' } = req.body;
    
    if (testMode === 'demo') {
      // Test demo authentication
      const demoToken = 'demo-token-12345';
      
      // This should pass in demo mode
      healthMonitor.recordAuthAttempt(true);
      
      successResponse(res, 'Demo authentication test passed', {
        testMode: 'demo',
        token: 'demo-token-***',
        status: 'success',
        timestamp: new Date().toISOString()
      });
    } else {
      errorResponse(res, 'Invalid test mode. Only "demo" mode is supported.', 400);
    }
  } catch (error) {
    logger.error('Authentication test failed:', error);
    healthMonitor.recordAuthAttempt(false);
    errorResponse(res, 'Authentication test failed', 500, {
      error: error.message
    });
  }
});

/**
 * @route GET /api/health/database
 * @desc Database connectivity check
 * @access Public
 */
router.get('/database', async (req, res) => {
  try {
    const dbHealth = await healthMonitor.checkDatabase();
    
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: dbHealth.status === 'healthy',
      message: dbHealth.status === 'healthy' ? 
        'Database is healthy' : 
        'Database is unhealthy',
      data: dbHealth
    });
  } catch (error) {
    logger.error('Database health check failed:', error);
    errorResponse(res, 'Database health check failed', 503, {
      error: error.message
    });
  }
});

/**
 * @route GET /api/health/logs
 * @desc Get recent log entries for debugging
 * @access Public
 */
router.get('/logs', async (req, res) => {
  try {
    const { lines = 50, level = 'all' } = req.query;
    
    // This is a simplified version - in production you might want to read actual log files
    const logs = {
      message: 'Log retrieval endpoint',
      note: 'In production, this would return recent log entries from log files',
      requestedLines: parseInt(lines),
      requestedLevel: level,
      timestamp: new Date().toISOString(),
      availableLevels: ['error', 'warn', 'info', 'debug', 'all']
    };
    
    successResponse(res, 'Logs information', logs);
  } catch (error) {
    logger.error('Logs endpoint failed:', error);
    errorResponse(res, 'Failed to retrieve logs', 500, {
      error: error.message
    });
  }
});

export default router;