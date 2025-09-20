const { ConceptMapping, NamasteConcept, ICD11Concept } = require('../models');
const logger = require('../utils/logger');
const constants = require('../config/constants');

class MappingService {
  // Get mappings for a NAMASTE concept
  async getMappingsForConcept(namasteCode, system) {
    try {
      const namasteConcept = await NamasteConcept.findOne({
        where: { code: namasteCode, system, status: 'active' }
      });

      if (!namasteConcept) {
        throw new Error('NAMASTE concept not found');
      }

      const mappings = await ConceptMapping.findAll({
        where: {
          namasteConceptId: namasteConcept.id,
          status: 'active'
        },
        include: [
          {
            model: ICD11Concept,
            as: 'icd11Concept',
            attributes: ['code', 'display', 'definition', 'category']
          }
        ],
        order: [['confidenceScore', 'DESC']]
      });

      return {
        source: {
          code: namasteConcept.code,
          display: namasteConcept.display,
          system: namasteConcept.systemUri
        },
        mappings: mappings.map(mapping => ({
          target: {
            code: mapping.icd11Concept.code,
            display: mapping.icd11Concept.display,
            system: constants.ICD11_SYSTEM
          },
          relationship: mapping.relationship,
          confidenceScore: parseFloat(mapping.confidenceScore),
          comment: mapping.comment
        }))
      };

    } catch (error) {
      logger.error('Mapping service error:', error);
      throw new Error('Failed to retrieve mappings');
    }
  }

  // Translate concept from NAMASTE to ICD-11
  async translateConcept(sourceCode, sourceSystem, targetSystem = 'icd11') {
    try {
      const mappingResult = await this.getMappingsForConcept(sourceCode, sourceSystem);
      
      if (mappingResult.mappings.length === 0) {
        return {
          source: mappingResult.source,
          target: null,
          equivalence: 'unmappable',
          message: 'No equivalent concept found in target system'
        };
      }

      // Return the highest confidence mapping
      const bestMapping = mappingResult.mappings[0];
      
      return {
        source: mappingResult.source,
        target: bestMapping.target,
        equivalence: bestMapping.relationship,
        confidence: bestMapping.confidenceScore,
        comment: bestMapping.comment
      };

    } catch (error) {
      logger.error('Translation error:', error);
      throw new Error('Translation failed');
    }
  }

  // Get all mappings for ConceptMap resource
  async getAllMappings(sourceSystem = null) {
    try {
      const whereClause = { status: 'active' };
      
      const mappings = await ConceptMapping.findAll({
        where: whereClause,
        include: [
          {
            model: NamasteConcept,
            as: 'namasteConcept',
            where: sourceSystem ? { system: sourceSystem } : {},
            attributes: ['code', 'display', 'system', 'systemUri']
          },
          {
            model: ICD11Concept,
            as: 'icd11Concept',
            attributes: ['code', 'display', 'systemUri']
          }
        ],
        order: [['confidenceScore', 'DESC']]
      });

      return mappings;

    } catch (error) {
      logger.error('Get all mappings error:', error);
      throw new Error('Failed to retrieve all mappings');
    }
  }
}

module.exports = new MappingService();
