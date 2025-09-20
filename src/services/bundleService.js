const { v4: uuidv4 } = require('uuid');
const { buildConditionResource } = require('../utils/fhirUtils');
const mappingService = require('./mappingService');
const searchService = require('./searchService');
const logger = require('../utils/logger');

class BundleService {
  // Create FHIR Bundle with dual-coded conditions
  async createDualCodedBundle(patientId, conditions) {
    try {
      const bundleEntries = [];

      for (const condition of conditions) {
        const { namasteCode, system, clinicalStatus = 'active' } = condition;

        // Get NAMASTE concept
        const namasteConcept = await searchService.getConceptByCode(namasteCode, system);
        if (!namasteConcept) {
          throw new Error(`NAMASTE concept not found: ${namasteCode}`);
        }

        // Get ICD-11 mapping
        const translation = await mappingService.translateConcept(namasteCode, system);
        
        let conditionResource;

        if (translation.target) {
          // Create dual-coded condition
          conditionResource = buildConditionResource(
            patientId,
            {
              system: namasteConcept.systemUri,
              code: namasteConcept.code,
              display: namasteConcept.display
            },
            {
              code: translation.target.code,
              display: translation.target.display
            },
            clinicalStatus
          );

          // Add mapping confidence as extension
          conditionResource.code.coding[0].extension = [{
            url: 'http://terminology.gov.in/namaste/StructureDefinition/mapping-confidence',
            valueDecimal: translation.confidence
          }];

        } else {
          // Create NAMASTE-only condition
          conditionResource = {
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
              coding: [{
                system: namasteConcept.systemUri,
                code: namasteConcept.code,
                display: namasteConcept.display,
                extension: [{
                  url: 'http://terminology.gov.in/namaste/StructureDefinition/unmappable',
                  valueBoolean: true
                }]
              }],
              text: namasteConcept.display
            },
            subject: {
              reference: `Patient/${patientId}`
            },
            recordedDate: new Date().toISOString()
          };
        }

        bundleEntries.push(conditionResource);
      }

      // Create bundle
      const bundle = {
        resourceType: 'Bundle',
        id: uuidv4(),
        meta: {
          lastUpdated: new Date().toISOString()
        },
        type: 'collection',
        total: bundleEntries.length,
        entry: bundleEntries.map(resource => ({
          resource,
          fullUrl: `${process.env.FHIR_BASE_URL}/${resource.resourceType}/${resource.id}`
        }))
      };

      return bundle;

    } catch (error) {
      logger.error('Bundle creation error:', error);
      throw new Error('Failed to create dual-coded bundle');
    }
  }

  // Create transaction bundle for batch operations
  async createTransactionBundle(operations) {
    try {
      const bundleEntries = operations.map(operation => {
        const { method, resource, url } = operation;
        
        return {
          request: {
            method: method.toUpperCase(),
            url: url || `${resource.resourceType}/${resource.id || ''}`
          },
          resource: resource
        };
      });

      return {
        resourceType: 'Bundle',
        id: uuidv4(),
        meta: {
          lastUpdated: new Date().toISOString()
        },
        type: 'transaction',
        entry: bundleEntries
      };

    } catch (error) {
      logger.error('Transaction bundle error:', error);
      throw new Error('Failed to create transaction bundle');
    }
  }

  // Process search results into searchset bundle
  createSearchSetBundle(results, baseUrl, searchParams = {}) {
    const entries = results.map(result => ({
      fullUrl: `${baseUrl}/${result.resourceType}/${result.id}`,
      resource: result,
      search: {
        mode: 'match'
      }
    }));

    return {
      resourceType: 'Bundle',
      id: uuidv4(),
      meta: {
        lastUpdated: new Date().toISOString()
      },
      type: 'searchset',
      total: results.length,
      link: [
        {
          relation: 'self',
          url: `${baseUrl}?${new URLSearchParams(searchParams).toString()}`
        }
      ],
      entry: entries
    };
  }
}

module.exports = new BundleService();
