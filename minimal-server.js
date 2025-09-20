import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import routes from './src/routes/index.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';
import logger from './src/utils/logger.js';

// Load environment variables
dotenv.config();

// ES6 module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express application
const app = express();

console.log('✅ Express app created');

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

console.log('✅ Helmet configured');

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

console.log('✅ CORS configured');

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log('✅ Body parsing configured');

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

console.log('✅ Request logging configured');

// Serve static files for demo UI
app.use(express.static(path.join(__dirname, 'public')));

console.log('✅ Static files configured');

// API routes
app.use('/api', routes);

console.log('✅ API routes configured');

// FHIR endpoints at root level (FHIR standard)
import('./src/routes/fhir.js').then(fhirModule => {
  const fhirRoutes = fhirModule.default;
  app.use('/fhir', fhirRoutes);
  console.log('✅ FHIR routes configured');
}).catch(error => {
  console.error('❌ Error loading FHIR routes:', error);
});

// Serve demo UI at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'ABHA Authentication Server is running!', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

console.log('✅ Routes configured');

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

console.log('✅ Error handlers configured');

const PORT = process.env.PORT || 3000;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`🌟 ABHA Authentication Server running successfully!`);
  console.log(`📱 Demo UI: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`🏥 FHIR: http://localhost:${PORT}/fhir`);
  console.log(`🧪 Test: http://localhost:${PORT}/test`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

console.log('✅ Server startup complete');