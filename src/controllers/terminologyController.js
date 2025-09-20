import searchService from '../services/searchService.js';
import aiService from '../services/aiService.js';
import { formatSearchResults, createResponse } from '../utils/response.js';
import { searchValidation, validateRequest } from '../middleware/validation.js';
import logger from '../utils/logger.js';

class TerminologyController {
  // Search concepts across all systems with AI enhancement
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

      // First try traditional search
      let results;
      try {
        results = await searchService.searchConcepts(q.trim(), searchOptions);
      } catch (error) {
        logger.warn('Traditional search failed, falling back to AI search:', error.message);
        // Use AI search as fallback
        const aiResults = await aiService.searchSimilarConcepts(q.trim(), searchOptions.system, searchOptions.limit);
        results = {
          concepts: aiResults.map(concept => ({
            code: concept.code,
            display: concept.display,
            system: concept.system || searchOptions.system || 'http://terminology.gov.in/namaste',
            definition: concept.definition,
            systemUri: concept.system
          })),
          total: aiResults.length,
          system: searchOptions.system
        };
      }
      
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

  // AI-powered concept mapping
  async mapConcepts(req, res, next) {
    try {
      const { concept, sourceSystem = 'namaste', targetSystem = 'icd11', confidence = 0.7 } = req.body;

      if (!concept) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            details: {
              text: 'Concept is required for mapping'
            }
          }]
        });
      }

      logger.info(`AI mapping request: ${concept} (${sourceSystem} -> ${targetSystem})`);
      
      const mappingResult = await aiService.mapTraditionalToICD11(concept, sourceSystem);

      if (!mappingResult || mappingResult.confidence < confidence) {
        return res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'warning',
            code: 'not-found',
            details: {
              text: `No mapping found with sufficient confidence (${confidence})`
            }
          }]
        });
      }

      res.json({
        resourceType: 'ConceptMap',
        url: `http://terminology.gov.in/namaste/ConceptMap/${sourceSystem}-to-${targetSystem}`,
        name: `${sourceSystem.toUpperCase()}-to-${targetSystem.toUpperCase()}`,
        status: 'active',
        sourceUri: `http://terminology.gov.in/namaste/${sourceSystem}`,
        targetUri: targetSystem === 'icd11' ? 'http://id.who.int/icd/release/11/mms' : `http://terminology.gov.in/namaste/${targetSystem}`,
        group: [{
          source: `http://terminology.gov.in/namaste/${sourceSystem}`,
          target: targetSystem === 'icd11' ? 'http://id.who.int/icd/release/11/mms' : `http://terminology.gov.in/namaste/${targetSystem}`,
          element: [{
            code: mappingResult.sourceCode || concept.toLowerCase().replace(/\s+/g, '-'),
            display: concept,
            target: [{
              code: mappingResult.targetCode,
              display: mappingResult.targetDisplay,
              equivalence: mappingResult.confidence > 0.9 ? 'equivalent' : 
                          mappingResult.confidence > 0.8 ? 'wider' : 'related',
              comment: mappingResult.explanation
            }]
          }]
        }]
      });

    } catch (error) {
      logger.error('AI concept mapping error:', error);
      next(error);
    }
  }

  // AI-powered concept translation
  async translateConcept(req, res, next) {
    try {
      const { concept, sourceLanguage = 'en', targetLanguage, system = 'namaste' } = req.body;

      if (!concept || !targetLanguage) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            details: {
              text: 'Concept and target language are required'
            }
          }]
        });
      }

      logger.info(`AI translation request: ${concept} (${sourceLanguage} -> ${targetLanguage})`);
      
      const translationResult = await aiService.translateConcept(concept, sourceLanguage, targetLanguage, system);

      res.json({
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'translation',
            part: [
              {
                name: 'source',
                valueString: concept
              },
              {
                name: 'sourceLanguage',
                valueCode: sourceLanguage
              },
              {
                name: 'target',
                valueString: translationResult.translatedTerm
              },
              {
                name: 'targetLanguage',
                valueCode: targetLanguage
              },
              {
                name: 'confidence',
                valueDecimal: translationResult.confidence
              },
              {
                name: 'culturalContext',
                valueString: translationResult.culturalContext
              }
            ]
          }
        ]
      });

    } catch (error) {
      logger.error('AI concept translation error:', error);
      next(error);
    }
  }

  // AI-powered symptom analysis
  async analyzeSymptoms(req, res, next) {
    try {
      const { symptoms, language = 'en', system = 'ayurveda' } = req.body;

      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            details: {
              text: 'Symptoms array is required and cannot be empty'
            }
          }]
        });
      }

      logger.info(`AI symptom analysis request: ${symptoms.join(', ')} (${system})`);
      
      const analysisResult = await aiService.analyzeSymptoms(symptoms, language, system);

      res.json({
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'analysis',
            part: [
              {
                name: 'symptoms',
                valueString: symptoms.join(', ')
              },
              {
                name: 'system',
                valueCode: system
              },
              {
                name: 'suggestedConditions',
                resource: {
                  resourceType: 'Bundle',
                  type: 'collection',
                  entry: analysisResult.suggestedConditions?.map(condition => ({
                    resource: {
                      resourceType: 'Condition',
                      code: {
                        coding: [{
                          system: `http://terminology.gov.in/namaste/${system}`,
                          code: condition.code,
                          display: condition.display
                        }]
                      },
                      severity: {
                        coding: [{
                          system: 'http://hl7.org/fhir/condition-severity',
                          code: condition.severity || 'moderate'
                        }]
                      },
                      note: [{
                        text: condition.explanation
                      }]
                    }
                  })) || []
                }
              },
              {
                name: 'recommendations',
                valueString: analysisResult.recommendations
              }
            ]
          }
        ]
      });

    } catch (error) {
      logger.error('AI symptom analysis error:', error);
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
