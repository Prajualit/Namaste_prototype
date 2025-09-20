import searchService from '../services/searchService.js';
import { formatSearchResults, createResponse } from '../utils/response.js';
import { searchValidation, validateRequest } from '../middleware/validation.js';
import logger from '../utils/logger.js';

class TerminologyController {
  // Search concepts across all systems
  async searchConcepts(req, res, next) {
    try {
      const { q, system = 'all', _limit = 20, _offset = 0 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            details: {
              text: 'Search query must be at least 2 characters long'
            }
          }]
        });
      }

      const searchOptions = {
        system: system === 'all' ? null : system,
        limit: parseInt(_limit),
        offset: parseInt(_offset),
        includeDefinitions: true
      };

      const results = await searchService.searchConcepts(q.trim(), searchOptions);
      
      const formattedResults = formatSearchResults(results.concepts, results.system);

      res.json({
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'result',
            part: [
              {
                name: 'total',
                valueInteger: results.total
              },
              {
                name: 'offset',
                valueInteger: searchOptions.offset
              },
              {
                name: 'limit',
                valueInteger: searchOptions.limit
              },
              {
                name: 'concepts',
                resource: {
                  resourceType: 'Bundle',
                  type: 'searchset',
                  total: results.total,
                  entry: formattedResults.map(concept => ({
                    resource: {
                      resourceType: 'Basic',
                      code: {
                        coding: [{
                          system: concept.system,
                          code: concept.code,
                          display: concept.display
                        }]
                      },
                      text: {
                        status: 'additional',
                        div: concept.definition || concept.display
                      }
                    }
                  }))
                }
              }
            ]
          }
        ]
      });

    } catch (error) {
      logger.error('Search concepts error:', error);
      next(error);
    }
  }

  // Get concept by code
  async getConceptByCode(req, res, next) {
    try {
      const { system, code } = req.params;

      const concept = await searchService.getConceptByCode(code, system);
      
      if (!concept) {
        return res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            details: {
              text: `Concept not found: ${system}|${code}`
            }
          }]
        });
      }

      res.json({
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'concept',
            part: [
              {
                name: 'system',
                valueUri: concept.systemUri || concept.system
              },
              {
                name: 'code',
                valueCode: concept.code
              },
              {
                name: 'display',
                valueString: concept.display
              },
              {
                name: 'definition',
                valueString: concept.definition
              }
            ]
          }
        ]
      });

    } catch (error) {
      logger.error('Get concept error:', error);
      next(error);
    }
  }

  // Get systems information
  async getSystems(req, res, next) {
    try {
      const systems = [
        {
          system: 'http://terminology.gov.in/namaste/ayurveda',
          name: 'NAMASTE Ayurveda',
          description: 'Traditional Ayurvedic medicine terminology'
        },
        {
          system: 'http://terminology.gov.in/namaste/siddha',
          name: 'NAMASTE Siddha',
          description: 'Traditional Siddha medicine terminology'
        },
        {
          system: 'http://terminology.gov.in/namaste/unani',
          name: 'NAMASTE Unani',
          description: 'Traditional Unani medicine terminology'
        },
        {
          system: 'http://id.who.int/icd/release/11/mms',
          name: 'ICD-11 MMS',
          description: 'WHO International Classification of Diseases 11th Revision'
        }
      ];

      res.json({
        resourceType: 'Bundle',
        type: 'collection',
        total: systems.length,
        entry: systems.map(sys => ({
          resource: {
            resourceType: 'CodeSystem',
            url: sys.system,
            name: sys.name,
            title: sys.name,
            status: 'active',
            description: sys.description
          }
        }))
      });

    } catch (error) {
      logger.error('Get systems error:', error);
      next(error);
    }
  }
}

export default new TerminologyController();
