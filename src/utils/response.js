import { v4 as uuidv4 } from 'uuid';

// Standardized response formatting
export const createResponse = (data, statusCode = 200) => {
  return {
    statusCode,
    data,
    timestamp: new Date().toISOString()
  };
};

// Success response helper
export const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Error response helper
export const errorResponse = (res, message, statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: details,
    timestamp: new Date().toISOString()
  });
};

// FHIR Bundle response helper
export const createBundle = (type, entries, total = null) => {
  return {
    resourceType: 'Bundle',
    id: uuidv4(),
    meta: {
      lastUpdated: new Date().toISOString()
    },
    type: type,
    total: total || entries.length,
    entry: entries.map(entry => ({
      resource: entry,
      fullUrl: entry.id ? `${process.env.FHIR_BASE_URL}/${entry.resourceType}/${entry.id}` : undefined
    }))
  };
};

// Search result formatting
export const formatSearchResults = (results, system = null) => {
  return results.map(result => ({
    system: system || result.systemUri,
    code: result.code,
    display: result.display,
    definition: result.definition,
    properties: result.properties || {}
  }));
};

// FHIR OperationOutcome for successful operations
export const createOperationOutcome = (severity = 'information', code = 'informational', message) => {
  return {
    resourceType: 'OperationOutcome',
    id: uuidv4(),
    meta: {
      lastUpdated: new Date().toISOString()
    },
    issue: [{
      severity,
      code,
      details: {
        text: message
      }
    }]
  };
};

export default {
  createResponse,
  successResponse,
  errorResponse,
  createBundle,
  formatSearchResults,
  createOperationOutcome
};
