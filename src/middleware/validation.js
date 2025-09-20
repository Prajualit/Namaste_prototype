const { body, param, query, validationResult } = require('express-validator');

// Request validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      resourceType: 'OperationOutcome',
      issue: errors.array().map(error => ({
        severity: 'error',
        code: 'invalid',
        expression: [error.param],
        details: {
          text: error.msg
        }
      }))
    });
  }
  
  next();
};

// Common validation rules
const searchValidation = [
  query('q').optional().isLength({ min: 2, max: 100 })
    .withMessage('Query must be between 2 and 100 characters'),
  query('system').optional().isIn(['ayurveda', 'siddha', 'unani', 'icd11'])
    .withMessage('Invalid system'),
  query('_limit').optional().isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('_offset').optional().isInt({ min: 0 })
    .withMessage('Offset must be non-negative')
];

const translationValidation = [
  body('source.system').notEmpty()
    .withMessage('Source system is required'),
  body('source.code').notEmpty()
    .withMessage('Source code is required'),
  body('target').optional().isIn(['icd11'])
    .withMessage('Invalid target system')
];

const fhirResourceValidation = [
  body('resourceType').notEmpty()
    .withMessage('Resource type is required'),
  body('id').optional().matches(/^[A-Za-z0-9\-\.]{1,64}$/)
    .withMessage('Invalid FHIR ID format')
];

module.exports = {
  validateRequest,
  searchValidation,
  translationValidation,
  fhirResourceValidation
};
