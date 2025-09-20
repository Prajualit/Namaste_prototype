import express from 'express';
import translationController from '../controllers/translationController.js';
import { translationValidation, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Translate single concept
// POST /translation/$translate
router.post('/$translate', 
  translationValidation, 
  validateRequest, 
  translationController.translateConcept
);

// Get all mappings for a concept
// GET /translation/ayurveda/concepts/AY001/mappings
router.get('/:system/concepts/:code/mappings', 
  translationController.getConceptMappings
);

// Batch translate multiple concepts
// POST /translation/$batch-translate
router.post('/$batch-translate', 
  translationController.batchTranslate
);

export default router;
