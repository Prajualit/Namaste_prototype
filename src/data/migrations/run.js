const { sequelize } = require('../../models');
const logger = require('../../utils/logger');

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    
    // Create database if it doesn't exist
    await sequelize.query('CREATE DATABASE IF NOT EXISTS namaste_demo');
    
    // Create extensions
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
    
    // Sync all models (create tables)
    await sequelize.sync({ force: false, alter: true });
    
    // Create search indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_namaste_search 
      ON namaste_concepts 
      USING gin(to_tsvector('english', display || ' ' || COALESCE(definition, '')))
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_icd11_search 
      ON icd11_concepts 
      USING gin(to_tsvector('english', display || ' ' || COALESCE(definition, '')))
    `);
    
    logger.info('Database migrations completed successfully');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runMigrations;
