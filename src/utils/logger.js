import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom format for ABHA operations
const abhaFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, ...meta } = info;
    
    // Add special formatting for ABHA-related logs
    if (meta.abhaId || meta.abhaOperation || meta.tokenValidation) {
      const abhaContext = {
        abhaId: meta.abhaId,
        operation: meta.abhaOperation,
        tokenStatus: meta.tokenValidation,
        userAgent: meta.userAgent,
        ip: meta.ip
      };
      
      return JSON.stringify({
        timestamp,
        level,
        message,
        service,
        abhaContext,
        ...meta
      });
    }
    
    return JSON.stringify({ timestamp, level, message, service, ...meta });
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: abhaFormat,
  defaultMeta: { service: 'namaste-abha-demo' },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    }),
    
    // ABHA-specific logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/abha.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf((info) => {
          // Only log ABHA-related operations
          if (info.abhaId || info.abhaOperation || info.tokenValidation) {
            return JSON.stringify(info);
          }
          return false; // Skip non-ABHA logs
        })
      )
    }),
    
    // All logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/exceptions.log') 
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/rejections.log') 
    })
  ]
});

// In development, also log to console with colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.colorize({ all: true }),
      winston.format.printf((info) => {
        const { timestamp, level, message, service, ...meta } = info;
        
        // Highlight ABHA operations in console
        if (meta.abhaOperation) {
          return `${timestamp} [${service}] ${level}: [ABHA:${meta.abhaOperation}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        }
        
        return `${timestamp} [${service}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
      })
    )
  }));
}

// Helper methods for specific logging scenarios
logger.abhaAuth = (message, meta = {}) => {
  logger.info(message, { 
    abhaOperation: 'authentication', 
    ...meta 
  });
};

logger.abhaToken = (message, meta = {}) => {
  logger.info(message, { 
    abhaOperation: 'token_validation', 
    ...meta 
  });
};

logger.abhaProfile = (message, meta = {}) => {
  logger.info(message, { 
    abhaOperation: 'profile_management', 
    ...meta 
  });
};

logger.abhaError = (message, error, meta = {}) => {
  logger.error(message, { 
    abhaOperation: 'error',
    error: error.message,
    stack: error.stack,
    ...meta 
  });
};

logger.security = (message, meta = {}) => {
  logger.warn(message, { 
    securityEvent: true,
    ...meta 
  });
};

export default logger;
