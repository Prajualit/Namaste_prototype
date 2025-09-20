console.log("Testing ABHA Authentication System...");

// Test basic imports
import express from 'express';
import logger from './src/utils/logger.js';

console.log("✅ Express and logger imports successful");

// Test basic server setup
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'ABHA Authentication System Test',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📋 Test the ABHA authentication at: http://localhost:${PORT}/test`);
});