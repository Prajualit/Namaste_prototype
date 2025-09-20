// Test login endpoint with demo token
const demoToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlbW8ta2V5LWlkIn0.eyJzdWIiOiIxMjM0NTY3ODkwMTIzNCIsImlzcyI6Imh0dHBzOi8vYWJoYXNieC5hYmRtLmdvdi5pbiIsImF1ZCI6ImFiaGEtZGVtby1hcHAiLCJleHAiOjE3NTg0ODYzNDksImlhdCI6MTc1ODM5OTk0OSwianRpIjoiZGVtby1qd3QtMTc1ODM5OTk0OTY5NSIsImFiaGFJZCI6IjEyMzQ1Njc4OTAxMjM0IiwiYWJoYU51bWJlciI6IjEyMzQ1Njc4OTAxMjM0IiwibmFtZSI6IkRlbW8gQUJIQSBVc2VyIiwiZmlyc3ROYW1lIjoiRGVtbyIsImxhc3ROYW1lIjoiVXNlciIsImdlbmRlciI6Ik0iLCJtb2JpbGUiOiI5OTk5OTk5OTk5IiwiZW1haWwiOiJkZW1vQGFiaGEuZ292LmluIiwiZGF0ZU9mQmlydGgiOiIxOTkwLTAxLTAxIiwiYWRkcmVzcyI6eyJzdGF0ZSI6IkRlbGhpIiwiZGlzdHJpY3QiOiJDZW50cmFsIERlbGhpIiwic3ViRGlzdHJpY3QiOiJDb25uYXVnaHQgUGxhY2UiLCJ2aWxsYWdlIjoiTmV3IERlbGhpIiwidG93biI6Ik5ldyBEZWxoaSIsInBpbmNvZGUiOiIxMTAwMDEiLCJhZGRyZXNzTGluZSI6IkRlbW8gQWRkcmVzcywgTmV3IERlbGhpIn0sImhlYWx0aElkIjoiZGVtby1oZWFsdGgtaWQiLCJwcm9mZXNzaW9uYWxRdWFsaWZpY2F0aW9ucyI6WyJCQU1TIl0sInJlZ2lzdHJhdGlvbk51bWJlciI6IkFZVVNIL0RFTU8vMTIzNDUiLCJ2ZXJpZmljYXRpb25TdGF0dXMiOiJ2ZXJpZmllZCIsInNjb3BlIjoiYWJoYS1wcm9maWxlIn0.8ANzEEiAPqE9YY5n_ipJfHb-hxYYRWRCT5NGpoDkygc";

async function testLogin() {
  try {
    console.log('🧪 Testing login endpoint with demo token...');
    
    const response = await fetch('http://localhost:3000/api/users/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: demoToken
      })
    });

    const result = await response.json();
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log('📋 Response Body:');
    console.log(JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed!');
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testLogin();