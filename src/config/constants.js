module.exports = {
  NAMASTE_SYSTEMS: {
    AYURVEDA: 'http://terminology.gov.in/namaste/ayurveda',
    SIDDHA: 'http://terminology.gov.in/namaste/siddha',
    UNANI: 'http://terminology.gov.in/namaste/unani',
  },
  
  ICD11_SYSTEM: 'http://id.who.int/icd/release/11/mms',
  
  EQUIVALENCE_TYPES: {
    EQUIVALENT: 'equivalent',
    WIDER: 'source-is-narrower-than-target',
    NARROWER: 'source-is-broader-than-target',
    RELATED: 'related-to',
    NOT_RELATED: 'not-related-to'
  },

  FHIR_ENDPOINTS: {
    BASE_URL: process.env.FHIR_BASE_URL || 'http://localhost:3000/fhir',
    NAMASTE_CODESYSTEM: '/CodeSystem/namaste',
    CONCEPT_MAP: '/ConceptMap/namaste-icd11'
  }
};
