import jwt from 'jsonwebtoken';

/**
 * Generate a demo ABHA JWT token for testing
 */
function generateDemoAbhaToken() {
  // Demo ABHA user payload (based on ABHA token structure)
  const payload = {
    sub: '12345678901234', // ABHA ID (subject)
    iss: 'https://abhasbx.abdm.gov.in', // Issuer
    aud: 'abha-demo-app', // Audience
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // Expires in 24 hours
    iat: Math.floor(Date.now() / 1000), // Issued at
    jti: 'demo-jwt-' + Date.now(), // JWT ID
    
    // ABHA-specific claims
    abhaId: '12345678901234',
    abhaNumber: '12345678901234',
    name: 'Demo ABHA User',
    firstName: 'Demo',
    lastName: 'User',
    gender: 'M',
    mobile: '9999999999',
    email: 'demo@abha.gov.in',
    dateOfBirth: '1990-01-01',
    address: {
      state: 'Delhi',
      district: 'Central Delhi',
      subDistrict: 'Connaught Place',
      village: 'New Delhi',
      town: 'New Delhi',
      pincode: '110001',
      addressLine: 'Demo Address, New Delhi'
    },
    healthId: 'demo-health-id',
    professionalQualifications: ['BAMS'],
    registrationNumber: 'AYUSH/DEMO/12345',
    verificationStatus: 'verified',
    scope: 'abha-profile'
  };

  // For demo purposes, use a simple secret
  // In production, this would be signed with ABHA's private key
  const secret = 'demo-abha-secret-key-for-testing-only';
  
  const token = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    header: {
      typ: 'JWT',
      alg: 'HS256',
      kid: 'demo-key-id'
    }
  });

  return token;
}

// Generate and display the token
const demoToken = generateDemoAbhaToken();

console.log('\n🎯 Demo ABHA JWT Token for Testing:\n');
console.log('Bearer ' + demoToken);
console.log('\n📝 How to use this token:');
console.log('\n1. For API testing with curl:');
console.log(`   curl -H "Authorization: Bearer ${demoToken}" http://localhost:3000/api/users/profile`);
console.log('\n2. For Postman/Insomnia:');
console.log('   - Add Authorization header');
console.log('   - Value: Bearer ' + demoToken);
console.log('\n3. For web requests:');
console.log('   headers: { "Authorization": "Bearer ' + demoToken + '" }');

console.log('\n🔍 Token payload (decoded):');
console.log(JSON.stringify(jwt.decode(demoToken), null, 2));

console.log('\n⚠️  Note: This is a DEMO token for testing only!');
console.log('   In production, tokens would be issued by ABHA servers.');