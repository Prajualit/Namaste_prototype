import mappingService from '../services/mappingService.js';
import { translationValidation, validateRequest } from '../middleware/validation.js';
import logger from '../utils/logger.js';

class TranslationController {
  // Translate concept between systems
  async translateConcept(req, res, next) {
    try {
      const { source, target = 'icd11' } = req.body;

      if (!source || !source.system || !source.code) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            details: {
              text: 'Source system and code are required'
            }
          }]
        });
      }

      const translation = await mappingService.translateConcept(
        source.code,
        source.system,
        target
      );

      // FHIR Parameters response for $translate operation
      const response = {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'result',
            valueBoolean: translation.target !== null
          },
          {
            name: 'message',
            valueString: translation.message || 'Translation completed'
          }
        ]
      };

      if (translation.target) {
        response.parameter.push(
          {
            name: 'match',
            part: [
              {
                name: 'equivalence',
                valueCode: translation.equivalence
              },
              {
                name: 'concept',
                valueCoding: {
                  system: translation.target.system,
                  code: translation.target.code,
                  display: translation.target.display
                }
              },
              {
                name: 'confidence',
                valueDecimal: translation.confidence
              }
            ]
          }
        );

        if (translation.comment) {
          response.parameter[response.parameter.length - 1].part.push({
            name: 'comment',
            valueString: translation.comment
          });
        }
      }

      res.json(response);

    } catch (error) {
      logger.error('Translation error:', error);
      next(error);
    }
  }

  // Get all mappings for a concept
  async getConceptMappings(req, res, next) {
    try {
      const { system, code } = req.params;

      const mappings = await mappingService.getMappingsForConcept(code, system);

      const response = {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'source',
            part: [
              {
                name: 'system',
                valueUri: mappings.source.system
              },
              {
                name: 'code',
                valueCode: mappings.source.code
              },
              {
                name: 'display',
                valueString: mappings.source.display
              }
            ]
          },
          {
            name: 'mappings',
            resource: {
              resourceType: 'Bundle',
              type: 'collection',
              total: mappings.mappings.length,
              entry: mappings.mappings.map(mapping => ({
                resource: {
                  resourceType: 'Basic',
                  code: {
                    coding: [{
                      system: 'http://terminology.gov.in/namaste/concept-mapping',
                      code: mapping.relationship,
                      display: mapping.relationship
                    }]
                  },
                  subject: {
                    display: `${mappings.source.display} -> ${mapping.target.display}`
                  },
                  extension: [
                    {
                      url: 'http://terminology.gov.in/namaste/StructureDefinition/target-concept',
                      valueCoding: {
                        system: mapping.target.system,
                        code: mapping.target.code,
                        display: mapping.target.display
                      }
                    },
                    {
                      url: 'http://terminology.gov.in/namaste/StructureDefinition/confidence-score',
                      valueDecimal: mapping.confidenceScore
                    }
                  ]
                }
              }))
            }
          }
        ]
      };

      res.json(response);

    } catch (error) {
      logger.error('Get mappings error:', error);
      next(error);
    }
  }

  // Batch translate multiple concepts
  async batchTranslate(req, res, next) {
    try {
      const { concepts, target = 'icd11' } = req.body;

      if (!concepts || !Array.isArray(concepts)) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            details: {
              text: 'Concepts array is required'
            }
          }]
        });
      }

      const translations = await Promise.all(
        concepts.map(async (concept) => {
          try {
            const translation = await mappingService.translateConcept(
              concept.code,
              concept.system,
              target
            );
            return { ...concept, translation, success: true };
          } catch (error) {
            return { 
              ...concept, 
              translation: null, 
              success: false, 
              error: error.message 
            };
          }
        })
      );

      res.json({
        resourceType: 'Bundle',
        type: 'batch-response',
        total: translations.length,
        entry: translations.map((item, index) => ({
          response: {
            status: item.success ? '200' : '400'
          },
          resource: item.success && item.translation.target ? {
            resourceType: 'Parameters',
            parameter: [
              {
                name: 'source',
                valueCoding: {
                  system: item.system,
                  code: item.code,
                  display: item.display
                }
              },
              {
                name: 'target',
                valueCoding: {
                  system: item.translation.target.system,
                  code: item.translation.target.code,
                  display: item.translation.target.display
                }
              },
              {
                name: 'equivalence',
                valueCode: item.translation.equivalence
              }
            ]
          } : {
            resourceType: 'OperationOutcome',
            issue: [{
              severity: 'error',
              code: 'not-found',
              details: {
                text: item.error || 'Translation not available'
              }
            }]
          }
        }))
      });

    } catch (error) {
      logger.error('Batch translate error:', error);
      next(error);
    }
  }
}

export default new TranslationController();
