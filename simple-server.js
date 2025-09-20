console.log('Step 1: Starting server test...');

try {
  console.log('Step 2: Importing app...');
  const appModule = await import('./src/app.js');
  const app = appModule.default;
  console.log('Step 3: App imported successfully');

  console.log('Step 4: Importing models...');
  const { sequelize } = await import('./src/models/index.js');
  console.log('Step 5: Models imported successfully');

  console.log('Step 6: Importing logger...');
  const loggerModule = await import('./src/utils/logger.js');
  const logger = loggerModule.default;
  console.log('Step 7: Logger imported successfully');

  const PORT = process.env.PORT || 3000;
  console.log(`Step 8: Using port ${PORT}`);

  console.log('Step 9: Testing database...');
  await sequelize.authenticate();
  console.log('Step 10: Database connection successful');

  console.log('Step 11: Starting server...');
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      sequelize.close();
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      sequelize.close();
      process.exit(0);
    });
  });

} catch (error) {
  console.error('❌ Error in server startup:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}