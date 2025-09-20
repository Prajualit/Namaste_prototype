import express from 'express';
import terminologyController from '../controllers/terminologyController.js';
import { searchValidation, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Search concepts across all systems
// GET /terminology/lookup?q=fever&system=ayurveda&_limit=20&_offset=0
router.get('/lookup', 
  searchValidation, 
  validateRequest, 
  terminologyController.searchConcepts
);

// Get concept by system and code
// GET /terminology/ayurveda/concepts/AY001
router.get('/:system/concepts/:code', 
  terminologyController.getConceptByCode
);

// Get available systems
// GET /terminology/systems
router.get('/systems', 
  terminologyController.getSystems
);

// AI-powered concept mapping
// POST /terminology/map
// Body: { "concept": "Pitta dosha imbalance", "sourceSystem": "ayurveda", "targetSystem": "icd11" }
router.post('/map', 
  terminologyController.mapConcepts
);

// AI-powered concept translation
// POST /terminology/translate
// Body: { "concept": "Vata dosha", "sourceLanguage": "en", "targetLanguage": "hi", "system": "ayurveda" }
router.post('/translate', 
  terminologyController.translateConcept
);

// AI-powered symptom analysis
// POST /terminology/analyze-symptoms
// Body: { "symptoms": ["headache", "fever", "nausea"], "language": "en", "system": "ayurveda" }
router.post('/analyze-symptoms', 
  terminologyController.analyzeSymptoms
);

export default router;
