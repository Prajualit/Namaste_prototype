const constants = require('./constants');

const FHIR_CONFIG = {
  version: 'R4',
  baseUrl: constants.FHIR_ENDPOINTS.BASE_URL,
  
  // FHIR Resource metadata
  publisher: 'National Institute of Traditional Medicine',
  jurisdiction: [{
    coding: [{
      system: 'urn:iso:std:iso:3166',
      code: 'IN',
      display: 'India'
    }]
  }],
  
  contact: [{
    name: 'NAMASTE Project Team',
    telecom: [{
      system: 'url',
      value: 'https://namaste.gov.in'
    }]
  }]
};

module.exports = FHIR_CONFIG;
