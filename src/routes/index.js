const express = require('express');
const terminologyRoutes = require('./terminology');
const fhirRoutes = require('./fhir');
const translationRoutes = require('./translation');
const { mockAuth } = require('../middleware/auth');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'NAMASTE-ICD11 Demo'
  });
});

// Apply authentication middleware to protected routes
router.use('/terminology', mockAuth, terminologyRoutes);
router.use('/fhir', fhirRoutes); // FHIR metadata endpoints are usually public
router.use('/translation', mockAuth, translationRoutes);

// Demo endpoints (public for demo UI)
router.get('/demo/status', (req, res) => {
  res.json({
    message: 'NAMASTE-ICD11 Demo API is running',
    endpoints: {
      terminology: '/api/terminology',
      fhir: '/api/fhir',
      translation: '/api/translation'
    },
    documentation: '/api/docs'
  });
});

module.exports = router;
