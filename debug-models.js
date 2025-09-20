console.log('Testing models import...');

try {
  console.log('Importing models...');
  import('./src/models/index.js').then((models) => {
    console.log('✅ Models imported successfully');
    console.log('Available models:', Object.keys(models));
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error importing models:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Sync error importing models:', error);
  process.exit(1);
}