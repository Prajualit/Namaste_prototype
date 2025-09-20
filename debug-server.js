import app from './src/app.js';
import { sequelize } from './src/models/index.js';
import logger from './src/utils/logger.js';

const PORT = process.env.PORT || 3000;

console.log('🚀 Starting ABHA Authentication Server...');
console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 Port: ${PORT}`);

// Database connection and server startup
async function startServer() {
  try {
    console.log('📡 Testing database connection...');
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    console.log('✅ Database connection successful');

    console.log('🔄 Synchronizing database models...');
    // Sync database models (create tables if they don't exist)
    if (process.env.NODE_ENV !== 'production') {
      // For SQLite, use force: true on first run, then switch to false
      await sequelize.sync({ force: false });
      logger.info('Database models synchronized');
      console.log('✅ Database models synchronized');
    }
    
    console.log('🎯 Starting Express server...');
    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Demo UI available at: http://localhost:${PORT}`);
      logger.info(`API available at: http://localhost:${PORT}/api`);
      logger.info(`FHIR endpoint: http://localhost:${PORT}/fhir`);
      
      console.log(`🌟 ABHA Authentication Server running successfully!`);
      console.log(`📱 Demo UI: http://localhost:${PORT}`);
      console.log(`🔌 API: http://localhost:${PORT}/api`);
      console.log(`🏥 FHIR: http://localhost:${PORT}/fhir`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        sequelize.close();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        sequelize.close();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

console.log('🎬 Initializing server startup...');
// Start the server
startServer();