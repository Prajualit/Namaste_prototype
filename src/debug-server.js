console.log('Step 1: Starting server.js execution');

try {
  console.log('Step 2: Attempting imports');
  
  console.log('Step 2a: Importing app...');
  const { default: app } = await import('./app.js');
  console.log('Step 2a: ✅ App imported');
  
  console.log('Step 2b: Importing models...');
  const { sequelize } = await import('./models/index.js');
  console.log('Step 2b: ✅ Models imported');
  
  console.log('Step 2c: Importing logger...');
  const { default: logger } = await import('./utils/logger.js');
  console.log('Step 2c: ✅ Logger imported');

  const PORT = process.env.PORT || 3000;
  
  console.log('Step 3: Starting server function...');
  
  async function startServer() {
    try {
      console.log('Step 4: Testing database...');
      await sequelize.authenticate();
      console.log('Step 5: ✅ Database connected');
      
      console.log('Step 6: Syncing database...');
      if (process.env.NODE_ENV !== 'production') {
        await sequelize.sync({ force: false });
        console.log('Step 7: ✅ Database synced');
      }
      
      console.log('Step 8: Starting Express server...');
      const server = app.listen(PORT, () => {
        console.log(`Step 9: ✅ ABHA Authentication Server running on http://localhost:${PORT}`);
      });
      
      console.log('Step 10: Server started successfully');
      
    } catch (error) {
      console.error('❌ Error in startServer:', error);
      process.exit(1);
    }
  }
  
  console.log('Step 11: Calling startServer...');
  await startServer();
  console.log('Step 12: startServer completed');
  
} catch (error) {
  console.error('❌ Error in main execution:', error);
  process.exit(1);
}