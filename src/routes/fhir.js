const express = require('express');
const fhirController = require('../controllers/fhirController');
const { fhirResourceValidation, validateRequest } = require('../middleware/validation');
const { mockAuth } = require('../middleware/auth');

const router = express.Router();

// FHIR metadata endpoint (public)
router.get('/metadata', fhirController.getMetadata);

// CodeSystem endpoints
router.get('/CodeSystem/namaste-:system', fhirController.getCodeSystem);

// ConceptMap endpoints
router.get('/ConceptMap/namaste-icd11', fhirController.getConceptMap);

// Protected endpoints
router.use(mockAuth);

// Create dual-coded bundle
// POST /fhir/Bundle
router.post('/Bundle', 
  fhirResourceValidation, 
  validateRequest, 
  fhirController.createDualCodedBundle
);

// Validate FHIR resource
// POST /fhir/$validate
router.post('/$validate', 
  fhirController.validateResource
);

module.exports = router;
