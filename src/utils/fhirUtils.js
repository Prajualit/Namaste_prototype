const { v4: uuidv4 } = require('uuid');
const constants = require('../config/constants');

// FHIR resource builders
const buildCodeSystem = (concepts, system, name, description) => {
  return {
    resourceType: 'CodeSystem',
    id: 'namaste-' + system.toLowerCase(),
    meta: {
      lastUpdated: new Date().toISOString(),
      versionId: '1'
    },
    url: constants.NAMASTE_SYSTEMS[system.toUpperCase()],
    identifier: [{
      use: 'official',
      system: 'http://namaste.gov.in/identifier',
      value: system.toLowerCase()
    }],
    version: '1.0.0',
    name: name,
    title: `NAMASTE ${name} Code System`,
    status: 'active',
    experimental: false,
    date: new Date().toISOString(),
    publisher: 'National Institute of Traditional Medicine',
    description: description,
    jurisdiction: [{
      coding: [{
        system: 'urn:iso:std:iso:3166',
        code: 'IN',
        display: 'India'
      }]
    }],
    caseSensitive: true,
    content: 'complete',
    count: concepts.length,
    concept: concepts.map(concept => ({
      code: concept.code,
      display: concept.display,
      definition: concept.definition,
      property: Object.keys(concept.properties || {}).map(key => ({
        code: key,
        valueString: concept.properties[key]
      }))
    }))
  };
};

const buildConceptMap = (mappings, sourceSystem, targetSystem) => {
  return {
    resourceType: 'ConceptMap',
    id: 'namaste-icd11-map',
    meta: {
      lastUpdated: new Date().toISOString(),
      versionId: '1'
    },
    url: `${constants.FHIR_ENDPOINTS.BASE_URL}/ConceptMap/namaste-icd11`,
    identifier: [{
      use: 'official',
      system: 'http://namaste.gov.in/conceptmap',
      value: 'namaste-icd11'
    }],
    version: '1.0.0',
    name: 'NAMASTEToICD11Map',
    title: 'NAMASTE to ICD-11 Concept Map',
    status: 'active',
    experimental: false,
    date: new Date().toISOString(),
    publisher: 'National Institute of Traditional Medicine',
    description: 'Mapping from NAMASTE traditional medicine concepts to ICD-11',
    sourceUri: sourceSystem,
    targetUri: targetSystem,
    group: [{
      source: sourceSystem,
      target: targetSystem,
      element: mappings.map(mapping => ({
        code: mapping.namasteConcept.code,
        display: mapping.namasteConcept.display,
        target: [{
          code: mapping.icd11Concept.code,
          display: mapping.icd11Concept.display,
          equivalence: mapping.relationship,
          comment: mapping.comment
        }]
      }))
    }]
  };
};

// FHIR Condition resource with dual coding
const buildConditionResource = (patientId, namasteCode, icd11Code, clinicalStatus = 'active') => {
  return {
    resourceType: 'Condition',
    id: uuidv4(),
    meta: {
      lastUpdated: new Date().toISOString(),
      profile: ['http://hl7.org/fhir/StructureDefinition/Condition']
    },
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: clinicalStatus,
        display: clinicalStatus.charAt(0).toUpperCase() + clinicalStatus.slice(1)
      }]
    },
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed',
        display: 'Confirmed'
      }]
    },
    code: {
      coding: [
        {
          system: namasteCode.system,
          code: namasteCode.code,
          display: namasteCode.display
        },
        {
          system: constants.ICD11_SYSTEM,
          code: icd11Code.code,
          display: icd11Code.display
        }
      ],
      text: namasteCode.display
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    recordedDate: new Date().toISOString()
  };
};

module.exports = {
  buildCodeSystem,
  buildConceptMap,
  buildConditionResource
};
