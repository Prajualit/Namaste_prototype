console.log('Testing app.js import...');

try {
  console.log('Importing app.js...');
  import('./src/app.js').then((app) => {
    console.log('✅ App imported successfully');
    console.log('App type:', typeof app.default);
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error importing app:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Sync error importing app:', error);
  process.exit(1);
}