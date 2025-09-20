console.log('Testing app initialization...');

async function testApp() {
  try {
    console.log('Importing app...');
    const appModule = await import('./src/app.js');
    const app = appModule.default;
    console.log('✅ App imported');
    
    const PORT = 3001;
    console.log(`Starting server on port ${PORT}...`);
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      
      // Test the server
      import('http').then(http => {
        const req = http.request(`http://localhost:${PORT}/`, (res) => {
          console.log('✅ Server is responding');
          server.close();
          console.log('✅ Server closed');
        });
        req.end();
      });
    });
    
  } catch (error) {
    console.error('❌ App error:', error);
    console.error('Stack:', error.stack);
  }
}

testApp();