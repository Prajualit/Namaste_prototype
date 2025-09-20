const express = require('express');
const translationController = require('../controllers/translationController');
const { translationValidation, validateRequest } = require('../middleware/validation');

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

module.exports = router;
