import fhirService from '../services/fhirService.js';
import bundleService from '../services/bundleService.js';
import aiService from '../services/aiService.js';
import logger from '../utils/logger.js';

class FhirController {
  // Get FHIR metadata/capability statement (AI-enhanced)
  async getMetadata(req, res, next) {
    try {
      // Try to get AI-enhanced capability statement first
      let capabilityStatement;
      try {
        capabilityStatement = await aiService.generateCapabilityStatement();
        logger.info('Using AI-generated capability statement');
      } catch (aiError) {
        logger.warn('AI capability statement failed, using fallback:', aiError.message);
        capabilityStatement = fhirService.generateCapabilityStatement();
      }
      
      res.json(capabilityStatement);
    } catch (error) {
      logger.error('Metadata error:', error);
      next(error);
    }
  }

  // Get NAMASTE CodeSystem (AI-enhanced)
  async getCodeSystem(req, res, next) {
    try {
      const { system } = req.params;

      if (!['ayurveda', 'siddha', 'unani'].includes(system)) {
        return res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            details: {
              text: `CodeSystem not found for system: ${system}`
            }
          }]
        });
      }

      // Try AI-generated CodeSystem first
      let codeSystem;
      try {
        codeSystem = await aiService.generateCodeSystem(system);
        logger.info(`Using AI-generated CodeSystem for ${system}`);
      } catch (aiError) {
        logger.warn(`AI CodeSystem generation failed for ${system}, using fallback:`, aiError.message);
        codeSystem = await fhirService.generateCodeSystem(system);
      }

      const validatedResource = fhirService.addMetadata(codeSystem);
      res.json(validatedResource);

    } catch (error) {
      logger.error('CodeSystem error:', error);
      next(error);
    }
  }

  // Get ConceptMap
  async getConceptMap(req, res, next) {
    try {
      const { source } = req.query;
      const conceptMap = await fhirService.generateConceptMap(source);
      const validatedResource = fhirService.addMetadata(conceptMap);

      res.json(validatedResource);

    } catch (error) {
      logger.error('ConceptMap error:', error);
      next(error);
    }
  }

  // Create dual-coded FHIR Bundle
  async createDualCodedBundle(req, res, next) {
    try {
      const { patientId, conditions } = req.body;

      if (!patientId) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            details: {
              text: 'Patient ID is required'
            }
          }]
        });
      }

      if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            details: {
              text: 'At least one condition is required'
            }
          }]
        });
      }

      const bundle = await bundleService.createDualCodedBundle(patientId, conditions);
      res.status(201).json(bundle);

    } catch (error) {
      logger.error('Create bundle error:', error);
      next(error);
    }
  }

  // Validate FHIR resource
  async validateResource(req, res, next) {
    try {
      const resource = req.body;
      const validation = fhirService.validateResource(resource);

      if (validation.isValid) {
        res.json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'information',
            code: 'informational',
            details: {
              text: 'Resource is valid'
            }
          }]
        });
      } else {
        res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: validation.errors.map(error => ({
            severity: 'error',
            code: 'structure',
            details: {
              text: error
            }
          }))
        });
      }

    } catch (error) {
      logger.error('Validation error:', error);
      next(error);
    }
  }
}

export default new FhirController();