import logger from '../utils/logger.js';
import userService from './userService.js';
import abhaService from './abhaService.js';
import sequelize from '../config/database.js';

/**
 * Health monitoring service for ABHA authentication system
 */
class HealthMonitorService {
  constructor() {
    this.healthMetrics = {
      uptime: process.uptime(),
      startTime: new Date(),
      totalRequests: 0,
      authSuccessCount: 0,
      authFailureCount: 0,
      lastHealthCheck: new Date()
    };
    
    // Start periodic health monitoring
    this.startMonitoring();
  }

  /**
   * Start periodic health monitoring
   */
  startMonitoring() {
    // Health check every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    // Log metrics every 30 minutes
    setInterval(() => {
      this.logHealthMetrics();
    }, 30 * 60 * 1000);
  }

  /**
   * Perform comprehensive health check
   * @returns {Object} Health status
   */
  async performHealthCheck() {
    const healthCheck = {
      timestamp: new Date(),
      status: 'healthy',
      services: {},
      metrics: this.getMetrics(),
      issues: []
    };

    try {
      // Check database connectivity
      healthCheck.services.database = await this.checkDatabase();
      
      // Check ABHA service connectivity
      healthCheck.services.abhaService = await this.checkAbhaService();
      
      // Check user service
      healthCheck.services.userService = await this.checkUserService();
      
      // Check memory usage
      healthCheck.services.memory = this.checkMemoryUsage();
      
      // Check disk space (logs directory)
      healthCheck.services.disk = await this.checkDiskSpace();
      
      // Determine overall health status
      const unhealthyServices = Object.values(healthCheck.services)
        .filter(service => service.status !== 'healthy');
      
      if (unhealthyServices.length > 0) {
        healthCheck.status = 'degraded';
        healthCheck.issues = unhealthyServices.map(service => ({
          service: service.name,
          issue: service.message || service.error
        }));
      }
      
      if (unhealthyServices.length >= Object.keys(healthCheck.services).length / 2) {
        healthCheck.status = 'unhealthy';
      }

    } catch (error) {
      logger.error('Health check failed:', error);
      healthCheck.status = 'unhealthy';
      healthCheck.issues.push({
        service: 'healthCheck',
        issue: error.message
      });
    }

    this.healthMetrics.lastHealthCheck = healthCheck.timestamp;
    
    if (healthCheck.status !== 'healthy') {
      logger.warn('Health check detected issues', {
        status: healthCheck.status,
        issues: healthCheck.issues,
        services: Object.keys(healthCheck.services).map(key => ({
          name: key,
          status: healthCheck.services[key].status
        }))
      });
    }

    return healthCheck;
  }

  /**
   * Check database connectivity
   */
  async checkDatabase() {
    try {
      await sequelize.authenticate();
      
      // Check if we can query users table
      const userCount = await userService.getUserStats();
      
      return {
        name: 'database',
        status: 'healthy',
        responseTime: Date.now(),
        details: {
          totalUsers: userCount.totalUsers,
          activeUsers: userCount.activeUsers
        }
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now()
      };
    }
  }

  /**
   * Check ABHA service connectivity
   */
  async checkAbhaService() {
    try {
      const startTime = Date.now();
      
      // Try to fetch JWKS keys
      const dummyToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3Qta2lkIn0.eyJzdWIiOiJ0ZXN0In0.test';
      
      try {
        // This will fail, but we're testing connectivity, not token validity
        await abhaService.verifyToken(dummyToken);
      } catch (error) {
        // Expected to fail, but if it's a network error, that's what we care about
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          throw error;
        }
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'abhaService',
        status: 'healthy',
        responseTime,
        details: {
          baseUrl: process.env.ABHA_BASE_URL,
          connected: true
        }
      };
    } catch (error) {
      return {
        name: 'abhaService',
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now()
      };
    }
  }

  /**
   * Check user service
   */
  async checkUserService() {
    try {
      const stats = await userService.getUserStats();
      
      return {
        name: 'userService',
        status: 'healthy',
        details: stats
      };
    } catch (error) {
      return {
        name: 'userService',
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check memory usage
   */
  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    const status = memoryUsagePercent > 90 ? 'unhealthy' : 
                   memoryUsagePercent > 75 ? 'warning' : 'healthy';
    
    return {
      name: 'memory',
      status,
      details: {
        heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
        heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
        usagePercent: Math.round(memoryUsagePercent),
        rss: Math.round(memUsage.rss / 1024 / 1024) // MB
      }
    };
  }

  /**
   * Check disk space (simplified check for logs directory)
   */
  async checkDiskSpace() {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const logsDir = path.join(__dirname, '../../logs');
      
      let totalSize = 0;
      try {
        const files = await fs.readdir(logsDir);
        for (const file of files) {
          const stats = await fs.stat(path.join(logsDir, file));
          totalSize += stats.size;
        }
      } catch (error) {
        // Logs directory might not exist yet
        totalSize = 0;
      }
      
      const totalSizeMB = totalSize / 1024 / 1024;
      const status = totalSizeMB > 100 ? 'warning' : 'healthy'; // Warning if logs > 100MB
      
      return {
        name: 'disk',
        status,
        details: {
          logsSizeMB: Math.round(totalSizeMB),
          logsDirectory: logsDir
        }
      };
    } catch (error) {
      return {
        name: 'disk',
        status: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      uptime: process.uptime(),
      startTime: this.healthMetrics.startTime,
      totalRequests: this.healthMetrics.totalRequests,
      authSuccessCount: this.healthMetrics.authSuccessCount,
      authFailureCount: this.healthMetrics.authFailureCount,
      authSuccessRate: this.getAuthSuccessRate(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }

  /**
   * Calculate authentication success rate
   */
  getAuthSuccessRate() {
    const total = this.healthMetrics.authSuccessCount + this.healthMetrics.authFailureCount;
    if (total === 0) return 100;
    return Math.round((this.healthMetrics.authSuccessCount / total) * 100);
  }

  /**
   * Log health metrics
   */
  logHealthMetrics() {
    const metrics = this.getMetrics();
    
    logger.info('Health metrics report', {
      metric: 'health_report',
      uptime: Math.round(metrics.uptime),
      totalRequests: metrics.totalRequests,
      authSuccessRate: metrics.authSuccessRate,
      memoryUsageMB: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record authentication attempt
   * @param {boolean} success - Whether authentication was successful
   */
  recordAuthAttempt(success) {
    this.healthMetrics.totalRequests++;
    if (success) {
      this.healthMetrics.authSuccessCount++;
    } else {
      this.healthMetrics.authFailureCount++;
    }
  }

  /**
   * Get service readiness status
   * @returns {Object} Readiness status
   */
  async getReadinessStatus() {
    try {
      // Check critical services only
      const dbCheck = await this.checkDatabase();
      const userServiceCheck = await this.checkUserService();
      
      const isReady = dbCheck.status === 'healthy' && 
                      userServiceCheck.status === 'healthy';
      
      return {
        ready: isReady,
        timestamp: new Date(),
        services: {
          database: dbCheck.status,
          userService: userServiceCheck.status
        }
      };
    } catch (error) {
      return {
        ready: false,
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Get liveness status (basic check)
   * @returns {Object} Liveness status
   */
  getLivenessStatus() {
    return {
      alive: true,
      timestamp: new Date(),
      uptime: process.uptime(),
      pid: process.pid,
      nodeVersion: process.version
    };
  }
}

export default new HealthMonitorService();