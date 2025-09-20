const path = require('path');
const fs = require('fs');
const { sequelize } = require('../../models');
const logger = require('../../utils/logger');

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    
    // Ensure data directory exists
    const dataDir = path.dirname(sequelize.options.storage || '');
    if (dataDir && !fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      logger.info('Created data directory:', dataDir);
    }
    
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Sync all models (create tables)
    await sequelize.sync({ force: false, alter: true });
    logger.info('Database tables synchronized successfully');
    
    logger.info('Database migrations completed successfully');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Database migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database migration failed:', error);
      process.exit(1);
    });
}

module.exports = runMigrations;
