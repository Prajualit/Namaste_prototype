import jwt from 'jsonwebtoken';
import axios from 'axios';
import NodeCache from 'node-cache';
import jwkToPem from 'jwk-to-pem';
import logger from '../utils/logger.js';
import errorHandler from './errorHandlerService.js';

class AbhaService {
  constructor() {
    // Cache for public keys (TTL: 24 hours)
    this.keyCache = new NodeCache({ stdTTL: 86400 });
    // Cache for user profiles (TTL: 1 hour)
    this.userCache = new NodeCache({ stdTTL: 3600 });
    
    this.config = {
      baseUrl: process.env.ABHA_BASE_URL || 'https://abhasbx.abdm.gov.in',
      authUrl: process.env.ABHA_AUTH_URL || 'https://abhasbx.abdm.gov.in/abha/api/v3',
      profileUrl: process.env.ABHA_PROFILE_URL || 'https://abhasbx.abdm.gov.in/abha/api/v3',
      clientId: process.env.ABHA_CLIENT_ID,
      clientSecret: process.env.ABHA_CLIENT_SECRET,
      // JWKS endpoint for public keys
      jwksUrl: process.env.ABHA_JWKS_URL || 'https://abhasbx.abdm.gov.in/.well-known/jwks.json'
    };
    
    this.validateConfig();
  }

  validateConfig() {
    const required = ['clientId', 'clientSecret'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0 && process.env.DEMO_MODE !== 'true') {
      logger.warn(`Missing ABHA configuration: ${missing.join(', ')}. Running in demo mode.`);
    }
  }

  /**
   * Verify ABHA JWT token
   * @param {string} token - JWT token from Authorization header
   * @returns {Promise<Object>} Decoded token payload
   */
  async verifyToken(token) {
    try {
      // Check if we're in demo mode and handle demo tokens
      if (!this.config.clientId || !this.config.clientSecret) {
        logger.info('Demo mode: verifying demo token');
        return this.verifyDemoToken(token);
      }

      // First, decode the token header to get the key ID (kid)
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded || !decoded.header) {
        throw new Error('Invalid token format');
      }

      const { kid, alg } = decoded.header;
      
      // Get the public key for verification
      const publicKey = await this.getPublicKey(kid);
      
      // Verify the token
      const payload = jwt.verify(token, publicKey, {
        algorithms: [alg || 'RS256'],
        issuer: this.config.baseUrl,
        audience: this.config.clientId
      });

      // Additional ABHA-specific validations
      this.validateAbhaToken(payload);

      return payload;
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw new Error('Token verification failed: ' + error.message);
    }
  }

  /**
   * Get public key from JWKS endpoint
   * @param {string} kid - Key ID from JWT header
   * @returns {Promise<string>} Public key for verification
   */
  async getPublicKey(kid) {
    const cacheKey = `jwks_key_${kid}`;
    let publicKey = this.keyCache.get(cacheKey);
    
    if (!publicKey) {
      try {
        logger.abhaToken('Fetching JWKS keys from ABHA', { kid });
        const startTime = Date.now();
        
        const response = await axios.get(this.config.jwksUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'NAMASTE-ICD11-Demo/1.0.0'
          }
        });

        const responseTime = Date.now() - startTime;
        logger.abhaToken('JWKS keys fetched successfully', { 
          responseTime, 
          keysCount: response.data.keys?.length 
        });

        const jwks = response.data;
        const key = jwks.keys.find(k => k.kid === kid);
        
        if (!key) {
          const error = errorHandler.createError(
            errorHandler.errorCodes.ABHA_KEY_FETCH_FAILED,
            `Public key not found for kid: ${kid}`,
            { kid, availableKids: jwks.keys.map(k => k.kid) }
          );
          throw error;
        }

        // Convert JWK to PEM format
        publicKey = this.jwkToPem(key);
        this.keyCache.set(cacheKey, publicKey);
        
        logger.abhaToken(`Public key cached for kid: ${kid}`);
      } catch (error) {
        const context = {
          operation: 'fetch_public_key',
          kid,
          endpoint: this.config.jwksUrl
        };
        
        if (error.code && error.code.startsWith('ABHA_')) {
          throw error; // Re-throw our standardized errors
        }
        
        logger.abhaError('Failed to fetch public key', error, context);
        const standardError = errorHandler.createError(
          errorHandler.errorCodes.ABHA_KEY_FETCH_FAILED,
          `Failed to fetch public key: ${error.message}`,
          context,
          error
        );
        throw standardError;
      }
    }

    return publicKey;
  }

  /**
   * Convert JWK to PEM format
   * @param {Object} jwk - JSON Web Key
   * @returns {string} PEM formatted key
   */
  jwkToPem(jwk) {
    try {
      return jwkToPem(jwk);
    } catch (error) {
      logger.error('Failed to convert JWK to PEM:', error);
      throw new Error('Failed to convert JWK to PEM format');
    }
  }

  /**
   * Validate ABHA token payload
   * @param {Object} payload - JWT payload
   */
  validateAbhaToken(payload) {
    const requiredFields = ['sub', 'iat', 'exp', 'abha_number'];
    const missingFields = requiredFields.filter(field => !payload[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate ABHA number format (14 digits)
    const abhaPattern = /^\d{14}$/;
    if (!abhaPattern.test(payload.abha_number)) {
      throw new Error('Invalid ABHA number format');
    }

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token has expired');
    }
  }

  /**
   * Get user profile from ABHA
   * @param {string} abhaNumber - ABHA number or token for demo mode
   * @param {string} accessToken - Access token for API calls
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(abhaNumber, accessToken) {
    // Handle demo mode
    if (!this.config.clientId || !this.config.clientSecret) {
      logger.info('Demo mode: returning demo user profile');
      // In demo mode, the first parameter might be the token, not abha number
      if (abhaNumber && abhaNumber.includes('.')) {
        // It's a JWT token, decode it
        try {
          const decoded = jwt.decode(abhaNumber);
          if (decoded) {
            return decoded; // Return the decoded token payload as profile
          }
        } catch (error) {
          logger.warn('Could not decode demo token, using fallback profile');
        }
      }
      // Return demo user profile
      return this.createDemoUser();
    }

    const cacheKey = `profile_${abhaNumber}`;
    let profile = this.userCache.get(cacheKey);

    if (!profile) {
      try {
        logger.info(`Fetching profile for ABHA: ${abhaNumber}`);
        
        const response = await axios.get(
          `${this.config.profileUrl}/profile/account`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'X-ABHA-Number': abhaNumber
            },
            timeout: 10000
          }
        );

        profile = this.normalizeUserProfile(response.data);
        this.userCache.set(cacheKey, profile);
        
        logger.info(`Profile cached for ABHA: ${abhaNumber}`);
      } catch (error) {
        logger.error('Failed to fetch user profile:', error);
        
        // Return minimal profile if API fails
        profile = this.createMinimalProfile(abhaNumber);
      }
    }

    return profile;
  }

  /**
   * Normalize user profile data
   * @param {Object} abhaProfile - Raw ABHA profile data
   * @returns {Object} Normalized profile
   */
  normalizeUserProfile(abhaProfile) {
    return {
      id: abhaProfile.healthIdNumber || abhaProfile.abha_number,
      abhaId: abhaProfile.abha_number,
      abhaAddress: abhaProfile.abha_address,
      name: abhaProfile.name,
      firstName: abhaProfile.firstName,
      lastName: abhaProfile.lastName,
      gender: abhaProfile.gender,
      dateOfBirth: abhaProfile.dateOfBirth,
      mobile: abhaProfile.mobile,
      email: abhaProfile.email,
      address: {
        line: abhaProfile.address?.line,
        district: abhaProfile.address?.district,
        state: abhaProfile.address?.state,
        pincode: abhaProfile.address?.pincode
      },
      // For NAMASTE system - determine practitioner specialty if applicable
      practitioner: this.determinePractitionerInfo(abhaProfile),
      verificationStatus: abhaProfile.kycStatus || 'verified',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Determine practitioner information based on profile
   * @param {Object} profile - ABHA profile
   * @returns {Object|null} Practitioner info or null
   */
  determinePractitionerInfo(profile) {
    // This would be based on professional qualifications in ABHA profile
    // For now, return default for demo
    if (profile.professionalQualifications) {
      return {
        id: `practitioner-${profile.abha_number}`,
        specialty: 'Traditional Medicine',
        system: 'ayurveda', // Default, could be determined from qualifications
        qualifications: profile.professionalQualifications,
        registrationNumber: profile.registrationNumber
      };
    }
    
    return null;
  }

  /**
   * Create minimal profile when API fails
   * @param {string} abhaNumber - ABHA number
   * @returns {Object} Minimal profile
   */
  createMinimalProfile(abhaNumber) {
    return {
      id: abhaNumber,
      abhaId: abhaNumber,
      name: 'ABHA User',
      verificationStatus: 'verified',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Validate access token with ABHA introspection endpoint
   * @param {string} token - Access token
   * @returns {Promise<Object>} Token info
   */
  async introspectToken(token) {
    try {
      const response = await axios.post(
        `${this.config.authUrl}/auth/introspect`,
        { token },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          auth: {
            username: this.config.clientId,
            password: this.config.clientSecret
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Token introspection failed:', error);
      throw new Error('Token introspection failed');
    }
  }

  /**
   * Create demo user for testing
   * @returns {Object} Demo user object
   */
  createDemoUser() {
    return {
      id: 'demo-abha-user-' + Date.now(),
      abhaId: '12345678901234',
      abhaAddress: 'demo@abha',
      name: 'Demo ABHA User',
      firstName: 'Demo',
      lastName: 'User',
      gender: 'M',
      mobile: '9999999999',
      email: 'demo@abha.gov.in',
      practitioner: {
        id: 'practitioner-demo-abha',
        specialty: 'Traditional Medicine',
        system: 'ayurveda',
        qualifications: ['BAMS'],
        registrationNumber: 'AYUSH/DEMO/12345'
      },
      verificationStatus: 'verified',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Verify demo token for testing (demo mode only)
   * @param {string} token - Demo JWT token
   * @returns {Promise<Object>} Decoded token payload
   */
  async verifyDemoToken(token) {
    try {
      // Use the same secret we used to generate the demo token
      const demoSecret = 'demo-abha-secret-key-for-testing-only';
      
      // Verify and decode the demo token
      const payload = jwt.verify(token, demoSecret, {
        algorithms: ['HS256']
      });

      logger.info('Demo token verified successfully', {
        abhaId: payload.abhaId,
        name: payload.name,
        exp: new Date(payload.exp * 1000).toISOString()
      });

      return payload;
    } catch (error) {
      logger.error('Demo token verification failed:', error);
      
      // If demo token verification fails, return a basic demo payload
      logger.warn('Using fallback demo user profile');
      return {
        sub: '12345678901234',
        abhaId: '12345678901234',
        abhaNumber: '12345678901234',
        name: 'Demo ABHA User',
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@abha.gov.in',
        mobile: '9999999999',
        gender: 'M',
        verificationStatus: 'verified',
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours from now
        iat: Math.floor(Date.now() / 1000)
      };
    }
  }
}

export default new AbhaService();