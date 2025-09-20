console.log('Testing database connection only...');

async function testDatabase() {
  try {
    console.log('Importing sequelize...');
    const { sequelize } = await import('./src/models/index.js');
    console.log('✅ Sequelize imported');
    
    console.log('Testing connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    console.log('Testing sync...');
    await sequelize.sync({ force: false });
    console.log('✅ Database sync successful');
    
    console.log('Closing connection...');
    await sequelize.close();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Database error:', error);
    console.error('Stack:', error.stack);
  }
}

testDatabase();