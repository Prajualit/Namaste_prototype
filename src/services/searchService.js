const { Op, Sequelize } = require('sequelize');
const { NamasteConcept, ICD11Concept } = require('../models');
const logger = require('../utils/logger');

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

      // PostgreSQL full-text search using TSVECTOR
      const namasteResults = await NamasteConcept.findAll({
        where: {
          ...searchConditions,
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn('to_tsvector', 'english', 
                Sequelize.fn('concat_ws', ' ', 
                  Sequelize.col('display'), 
                  Sequelize.col('definition')
                )
              ),
              '@@',
              Sequelize.fn('to_tsquery', 'english', this.formatSearchQuery(query))
            ),
            { display: { [Op.iLike]: `%${query}%` } },
            { code: { [Op.iLike]: `%${query}%` } }
          ]
        },
        attributes: [
          'id', 'code', 'display', 'definition', 'system', 'systemUri', 'properties',
          // Calculate relevance score
          [
            Sequelize.fn('ts_rank',
              Sequelize.fn('to_tsvector', 'english',
                Sequelize.fn('concat_ws', ' ',
                  Sequelize.col('display'),
                  Sequelize.col('definition')
                )
              ),
              Sequelize.fn('to_tsquery', 'english', this.formatSearchQuery(query))
            ),
            'rank'
          ]
        ],
        order: [
          [Sequelize.literal('rank'), 'DESC'],
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
            Sequelize.where(
              Sequelize.fn('to_tsvector', 'english',
                Sequelize.fn('concat_ws', ' ',
                  Sequelize.col('display'),
                  Sequelize.col('definition')
                )
              ),
              '@@',
              Sequelize.fn('to_tsquery', 'english', this.formatSearchQuery(query))
            ),
            { display: { [Op.iLike]: `%${query}%` } },
            { code: { [Op.iLike]: `%${query}%` } }
          ]
        },
        attributes: [
          'id', 'code', 'display', 'definition', 'systemUri', 'category',
          [
            Sequelize.fn('ts_rank',
              Sequelize.fn('to_tsvector', 'english',
                Sequelize.fn('concat_ws', ' ',
                  Sequelize.col('display'),
                  Sequelize.col('definition')
                )
              ),
              Sequelize.fn('to_tsquery', 'english', this.formatSearchQuery(query))
            ),
            'rank'
          ]
        ],
        order: [
          [Sequelize.literal('rank'), 'DESC'],
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

module.exports = new SearchService();
