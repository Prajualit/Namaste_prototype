import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import userService from './services/userService.js';
import healthMonitor from './services/healthMonitorService.js';

// Load environment variables
dotenv.config();

// ES6 module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express application
const app = express();

// Initialize user service
async function initializeServices() {
  try {
    await userService.initialize();
    logger.info('User service initialized successfully');
    
    // Initialize health monitoring (non-blocking)
    if (healthMonitor.startMonitoring) {
      healthMonitor.startMonitoring();
      logger.info('Health monitoring started');
    }
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Service initialization failed:', error);
    // Don't exit the process, just log the error and continue
    logger.warn('Continuing without full service initialization');
  }
}

// Initialize services on startup (non-blocking)
initializeServices().catch((error) => {
  logger.error('Service initialization error:', error);
  logger.warn('Server starting without full service initialization');
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Serve static files for demo UI
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', routes);

// FHIR endpoints at root level (FHIR standard)
import fhirRoutes from './routes/fhir.js';
app.use('/fhir', fhirRoutes);

// Serve demo UI at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
