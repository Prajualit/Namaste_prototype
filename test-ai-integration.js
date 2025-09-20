#!/usr/bin/env node

/**
 * Test AI Integration for NAMASTE Prototype
 * Tests the new AI-enhanced endpoints with proper authentication
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const baseUrl = 'http://localhost:3000';

// Demo JWT token for testing (using the same one we generated before)
const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlbW8ta2V5LWlkIn0.eyJzdWIiOiIxMjM0NTY3ODkwMTIzNCIsImlzcyI6Imh0dHBzOi8vYWJoYXNieC5hYmRtLmdvdi5pbiIsImF1ZCI6ImFiaGEtZGVtby1hcHAiLCJleHAiOjE3NTg0ODYzNDksImlhdCI6MTc1ODM5OTk0OSwianRpIjoiZGVtby1qd3QtMTc1ODM5OTk0OTY5NSIsImFiaGFJZCI6IjEyMzQ1Njc4OTAxMjM0IiwiYWJoYU51bWJlciI6IjEyMzQ1Njc4OTAxMjM0IiwibmFtZSI6IkRlbW8gQUJIQSBVc2VyIiwiZmlyc3ROYW1lIjoiRGVtbyIsImxhc3ROYW1lIjoiVXNlciIsImdlbmRlciI6Ik0iLCJtb2JpbGUiOiI5OTk5OTk5OTk5IiwiZW1haWwiOiJkZW1vQGFiaGEuZ292LmluIiwiZGF0ZU9mQmlydGgiOiIxOTkwLTAxLTAxIiwiYWRkcmVzcyI6eyJzdGF0ZSI6IkRlbGhpIiwiZGlzdHJpY3QiOiJDZW50cmFsIERlbGhpIiwic3ViRGlzdHJpY3QiOiJDb25uYXVnaHQgUGxhY2UiLCJ2aWxsYWdlIjoiTmV3IERlbGhpIiwidG93biI6Ik5ldyBEZWxoaSIsInBpbmNvZGUiOiIxMTAwMDEiLCJhZGRyZXNzTGluZSI6IkRlbW8gQWRkcmVzcywgTmV3IERlbGhpIn0sImhlYWx0aElkIjoiZGVtby1oZWFsdGgtaWQiLCJwcm9mZXNzaW9uYWxRdWFsaWZpY2F0aW9ucyI6WyJCQU1TIl0sInJlZ2lzdHJhdGlvbk51bWJlciI6IkFZVVNIL0RFTU8vMTIzNDUiLCJ2ZXJpZmljYXRpb25TdGF0dXMiOiJ2ZXJpZmllZCIsInNjb3BlIjoiYWJoYS1wcm9maWxlIn0.8ANzEEiAPqE9YY5n_ipJfHb-hxYYRWRCT5NGpoDkygc';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${demoToken}`
};

async function testEndpoint(name, url, method = 'GET', body = null) {
  try {
    console.log(`\n🧪 Testing ${name}:`);
    console.log(`   ${method} ${url}`);
    
    const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    };

    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Success (${response.status})`);
      if (data.resourceType) {
        console.log(`   📋 Resource Type: ${data.resourceType}`);
      }
      if (data.name) {
        console.log(`   📝 Name: ${data.name}`);
      }
      return data;
    } else {
      console.log(`   ❌ Failed (${response.status})`);
      console.log(`   📄 Response: ${JSON.stringify(data, null, 2)}`);
      return null;
    }
  } catch (error) {
    console.log(`   🚫 Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting AI Integration Tests for NAMASTE Prototype');
  console.log('=' .repeat(60));

  // Test public endpoints first
  console.log('\n📡 Testing Public Endpoints:');
  await testEndpoint('Health Check', `${baseUrl}/api/health`);
  await testEndpoint('Demo Status', `${baseUrl}/api/demo/status`);
  
  // Test FHIR endpoints (should be public)
  console.log('\n🏥 Testing AI-Enhanced FHIR Endpoints:');
  await testEndpoint('FHIR Capability Statement (AI-Enhanced)', `${baseUrl}/fhir/metadata`);
  await testEndpoint('Ayurveda CodeSystem (AI-Enhanced)', `${baseUrl}/fhir/CodeSystem/ayurveda`);
  await testEndpoint('Siddha CodeSystem (AI-Enhanced)', `${baseUrl}/fhir/CodeSystem/siddha`);
  
  // Test protected terminology endpoints with authentication
  console.log('\n🔐 Testing AI-Enhanced Terminology Endpoints (Protected):');
  await testEndpoint('Terminology Systems', `${baseUrl}/api/terminology/systems`);
  await testEndpoint('Concept Search', `${baseUrl}/api/terminology/lookup?q=fever&system=ayurveda&_limit=5`);
  
  // Test new AI endpoints
  console.log('\n🤖 Testing New AI-Powered Endpoints:');
  
  // AI Concept Mapping
  await testEndpoint('AI Concept Mapping', `${baseUrl}/api/terminology/map`, 'POST', {
    concept: 'Pitta dosha imbalance',
    sourceSystem: 'ayurveda',
    targetSystem: 'icd11',
    confidence: 0.7
  });
  
  // AI Concept Translation
  await testEndpoint('AI Concept Translation', `${baseUrl}/api/terminology/translate`, 'POST', {
    concept: 'Vata dosha',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
    system: 'ayurveda'
  });
  
  // AI Symptom Analysis
  await testEndpoint('AI Symptom Analysis', `${baseUrl}/api/terminology/analyze-symptoms`, 'POST', {
    symptoms: ['headache', 'fever', 'nausea'],
    language: 'en',
    system: 'ayurveda'
  });

  console.log('\n' + '='.repeat(60));
  console.log('🎯 AI Integration Tests Complete!');
  console.log('\n💡 Note: AI endpoints will show fallback responses when GEMINI_API_KEY is not configured');
  console.log('   This demonstrates graceful fallback behavior for the demo.');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Test interrupted by user');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught Exception:', error.message);
  process.exit(1);
});

// Run the tests
runTests().catch(console.error);