import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// FHIR-compliant error handler
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let issue = {
    severity: 'error',
    code: 'exception',
    details: {
      text: err.message || 'Internal server error'
    }
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    issue.code = 'invalid';
    issue.details.text = 'Validation failed: ' + err.message;
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    issue.code = 'duplicate';
    issue.details.text = 'Resource already exists';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    issue.code = 'invalid';
    issue.details.text = 'Invalid reference';
  }

  // FHIR OperationOutcome response
  res.status(statusCode).json({
    resourceType: 'OperationOutcome',
    id: uuidv4(),
    meta: {
      lastUpdated: new Date().toISOString()
    },
    issue: [issue]
  });
};

// 404 handler for FHIR endpoints
const notFoundHandler = (req, res) => {
  res.status(404).json({
    resourceType: 'OperationOutcome',
    id: uuidv4(),
    meta: {
      lastUpdated: new Date().toISOString()
    },
    issue: [{
      severity: 'error',
      code: 'not-found',
      details: {
        text: `Resource not found: ${req.path}`
      }
    }]
  });
};

export { errorHandler, notFoundHandler };
