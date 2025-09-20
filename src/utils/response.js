const { v4: uuidv4 } = require('uuid');

// Standardized response formatting
const createResponse = (data, statusCode = 200) => {
  return {
    statusCode,
    data,
    timestamp: new Date().toISOString()
  };
};

// FHIR Bundle response helper
const createBundle = (type, entries, total = null) => {
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
const formatSearchResults = (results, system = null) => {
  return results.map(result => ({
    system: system || result.systemUri,
    code: result.code,
    display: result.display,
    definition: result.definition,
    properties: result.properties || {}
  }));
};

// FHIR OperationOutcome for successful operations
const createOperationOutcome = (severity = 'information', code = 'informational', message) => {
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

module.exports = {
  createResponse,
  createBundle,
  formatSearchResults,
  createOperationOutcome
};
