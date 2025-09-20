const express = require('express');
const terminologyController = require('../controllers/terminologyController');
const { searchValidation, validateRequest } = require('../middleware/validation');

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

module.exports = router;
