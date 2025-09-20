import express from 'express';
import fhirController from '../controllers/fhirController.js';
import { fhirResourceValidation, validateRequest } from '../middleware/validation.js';
import { abhaAuth } from '../middleware/auth.js';

const router = express.Router();

// FHIR metadata endpoint (public)
router.get('/metadata', fhirController.getMetadata);

// CodeSystem endpoints
router.get('/CodeSystem/namaste-:system', fhirController.getCodeSystem);
router.get('/CodeSystem/:system', fhirController.getCodeSystem); // Add direct system access

// ConceptMap endpoints
router.get('/ConceptMap/namaste-icd11', fhirController.getConceptMap);

// Protected endpoints (for creating resources)
router.use('/Bundle', abhaAuth);

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

export default router;
