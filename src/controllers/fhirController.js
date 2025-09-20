const fhirService = require('../services/fhirService');
const bundleService = require('../services/bundleService');
const logger = require('../utils/logger');

class FhirController {
  // Get FHIR metadata/capability statement
  async getMetadata(req, res, next) {
    try {
      const capabilityStatement = fhirService.generateCapabilityStatement();
      res.json(capabilityStatement);
    } catch (error) {
      logger.error('Metadata error:', error);
      next(error);
    }
  }

  // Get NAMASTE CodeSystem
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

      const codeSystem = await fhirService.generateCodeSystem(system);
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

module.exports = new FhirController();