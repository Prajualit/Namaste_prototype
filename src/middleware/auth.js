const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Mock ABHA authentication for demo purposes
const mockAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'security',
        details: {
          text: 'Authorization header required'
        }
      }]
    });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'security',
        details: {
          text: 'Bearer token required'
        }
      }]
    });
  }

  try {
    // For demo mode, accept specific demo tokens
    if (process.env.DEMO_MODE === 'true') {
      // Accept demo tokens without JWT validation
      if (token === 'demo-token-12345' || token.startsWith('demo-')) {
        req.user = {
          id: 'demo-user-' + uuidv4(),
          abhaId: 'demo-abha-12345',
          practitioner: {
            id: 'practitioner-demo',
            specialty: 'Traditional Medicine',
            system: 'ayurveda'
          }
        };
        return next();
      }
    }

    // In production, validate against actual ABHA tokens
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'security',
        details: {
          text: 'Invalid or expired token'
        }
      }]
    });
  }
};

module.exports = { mockAuth };
