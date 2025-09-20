import express from 'express';
import terminologyRoutes from './terminology.js';
import fhirRoutes from './fhir.js';
import translationRoutes from './translation.js';
import userRoutes from './users.js';
import healthRoutes from './health.js';
import { abhaAuth } from '../middleware/auth.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'NAMASTE-ICD11 Demo with ABHA Authentication',
    authentication: 'ABHA-based',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Apply authentication middleware to protected routes
router.use('/health', healthRoutes); // Health monitoring endpoints (public)
router.use('/users', userRoutes); // User auth endpoints (login is public, others require auth)
router.use('/terminology', abhaAuth, terminologyRoutes);
router.use('/fhir', fhirRoutes); // FHIR metadata endpoints are usually public
router.use('/translation', abhaAuth, translationRoutes);

// Demo endpoints (public for demo UI)
router.get('/demo/status', (req, res) => {
  res.json({
    message: 'NAMASTE-ICD11 Demo API is running',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      terminology: '/api/terminology',
      fhir: '/api/fhir',
      translation: '/api/translation'
    },
    authentication: 'ABHA-based authentication required for protected endpoints',
    monitoring: {
      healthCheck: '/api/health',
      readiness: '/api/health/ready',
      liveness: '/api/health/live',
      metrics: '/api/health/metrics'
    },
    documentation: '/api/docs'
  });
});

export default router;
