import { Op, Sequelize } from 'sequelize';
// Using createRequire to import CommonJS models temporarily
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { NamasteConcept, ICD11Concept } = require('../models');
import logger from '../utils/logger.js';

class SearchService {
  // Full-text search across all systems
  async searchConcepts(query, options = {}) {
    const {
      system = null,
      limit = 20,
      offset = 0,
      includeDefinitions = true
    } = options;

    try {
      // Build search conditions
      const searchConditions = {
        status: 'active'
      };

      if (system && system !== 'all') {
        if (system === 'icd11') {
          return await this.searchICD11Concepts(query, { limit, offset, includeDefinitions });
        } else {
          searchConditions.system = system;
        }
      }

      // SQLite-compatible search using LIKE and basic text matching
      const namasteResults = await NamasteConcept.findAll({
        where: {
          ...searchConditions,
          [Op.or]: [
            { display: { [Op.like]: `%${query}%` } },
            { code: { [Op.like]: `%${query}%` } },
            { definition: { [Op.like]: `%${query}%` } }
          ]
        },
        attributes: [
          'id', 'code', 'display', 'definition', 'system', 'systemUri', 'properties'
        ],
        order: [
          // Simple ordering by relevance (exact matches first, then partial matches)
          [Sequelize.literal(`CASE 
            WHEN display LIKE '${query}%' THEN 1
            WHEN display LIKE '%${query}%' THEN 2
            WHEN code LIKE '${query}%' THEN 3
            ELSE 4
          END`), 'ASC'],
          ['display', 'ASC']
        ],
        limit,
        offset
      });

      return {
        concepts: namasteResults,
        total: namasteResults.length,
        system: 'namaste'
      };

    } catch (error) {
      logger.error('Search service error:', error);
      throw new Error('Search operation failed');
    }
  }

  // Search ICD-11 concepts
  async searchICD11Concepts(query, options = {}) {
    const { limit = 20, offset = 0 } = options;

    try {
      const icd11Results = await ICD11Concept.findAll({
        where: {
          status: 'active',
          [Op.or]: [
            { display: { [Op.like]: `%${query}%` } },
            { code: { [Op.like]: `%${query}%` } },
            { definition: { [Op.like]: `%${query}%` } }
          ]
        },
        attributes: [
          'id', 'code', 'display', 'definition', 'systemUri', 'category'
        ],
        order: [
          // Simple ordering by relevance (exact matches first, then partial matches)
          [Sequelize.literal(`CASE 
            WHEN display LIKE '${query}%' THEN 1
            WHEN display LIKE '%${query}%' THEN 2
            WHEN code LIKE '${query}%' THEN 3
            ELSE 4
          END`), 'ASC'],
          ['display', 'ASC']
        ],
        limit,
        offset
      });

      return {
        concepts: icd11Results,
        total: icd11Results.length,
        system: 'icd11'
      };

    } catch (error) {
      logger.error('ICD-11 search error:', error);
      throw new Error('ICD-11 search operation failed');
    }
  }

  // Format query for PostgreSQL tsquery
  formatSearchQuery(query) {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .split(/\s+/)
      .filter(word => word.length > 0)
      .join(' & '); // AND operation between words
  }

  // Get concept by code
  async getConceptByCode(code, system) {
    try {
      if (system === 'icd11') {
        return await ICD11Concept.findOne({
          where: { code, status: 'active' }
        });
      }

      return await NamasteConcept.findOne({
        where: { code, status: 'active' }
      });
    } catch (error) {
      logger.error('Get concept error:', error);
      throw new Error('Failed to retrieve concept');
    }
  }
}

export default new SearchService();
