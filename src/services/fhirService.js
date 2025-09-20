import { v4 as uuidv4 } from 'uuid';
import constants from '../config/constants.js';
import fhirConfig from '../config/fhir.js';
import searchService from './searchService.js';
import mappingService from './mappingService.js';
import { buildCodeSystem, buildConceptMap } from '../utils/fhirUtils.js';

class FhirService {
  // Generate NAMASTE CodeSystem resource
  async generateCodeSystem(system) {
    try {
      const concepts = await searchService.searchConcepts('', { 
        system, 
        limit: 1000,
        offset: 0 
      });

      const systemUri = constants.NAMASTE_SYSTEMS[system.toUpperCase()];
      const systemName = system.charAt(0).toUpperCase() + system.slice(1);
      
      return buildCodeSystem(
        concepts.concepts,
        system,
        systemName,
        `Traditional ${systemName} medicine terminology system`
      );

    } catch (error) {
      throw new Error(`Failed to generate CodeSystem for ${system}`);
    }
  }

  // Generate ConceptMap resource
  async generateConceptMap(sourceSystem = null) {
    try {
      const mappings = await mappingService.getAllMappings(sourceSystem);
      
      const sourceUri = sourceSystem ? 
        constants.NAMASTE_SYSTEMS[sourceSystem.toUpperCase()] : 
        'http://terminology.gov.in/namaste';

      return buildConceptMap(
        mappings,
        sourceUri,
        constants.ICD11_SYSTEM
      );

    } catch (error) {
      throw new Error('Failed to generate ConceptMap');
    }
  }

  // Validate FHIR resource structure (basic validation)
  validateResource(resource) {
    const errors = [];

    // Check required fields
    if (!resource.resourceType) {
      errors.push('Missing required field: resourceType');
    }

    if (!resource.id) {
      errors.push('Missing required field: id');
    }

    // Validate resource type specific fields
    switch (resource.resourceType) {
      case 'CodeSystem':
        if (!resource.url) errors.push('CodeSystem missing required field: url');
        if (!resource.content) errors.push('CodeSystem missing required field: content');
        break;
      
      case 'ConceptMap':
        if (!resource.url) errors.push('ConceptMap missing required field: url');
        if (!resource.sourceUri && !resource.sourceCanonical) {
          errors.push('ConceptMap missing source specification');
        }
        if (!resource.targetUri && !resource.targetCanonical) {
          errors.push('ConceptMap missing target specification');
        }
        break;
      
      case 'Condition':
        if (!resource.subject) errors.push('Condition missing required field: subject');
        if (!resource.code) errors.push('Condition missing required field: code');
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Add FHIR metadata to resources
  addMetadata(resource) {
    const now = new Date().toISOString();
    
    return {
      ...resource,
      meta: {
        ...resource.meta,
        lastUpdated: now,
        versionId: resource.meta?.versionId || '1',
        profile: this.getProfile(resource.resourceType)
      }
    };
  }

  // Get FHIR profile for resource type
  getProfile(resourceType) {
    const profiles = {
      'CodeSystem': ['http://hl7.org/fhir/StructureDefinition/CodeSystem'],
      'ConceptMap': ['http://hl7.org/fhir/StructureDefinition/ConceptMap'],
      'Condition': ['http://hl7.org/fhir/StructureDefinition/Condition'],
      'Bundle': ['http://hl7.org/fhir/StructureDefinition/Bundle']
    };

    return profiles[resourceType] || [];
  }

  // Generate capability statement
  generateCapabilityStatement() {
    return {
      resourceType: 'CapabilityStatement',
      id: 'namaste-capability',
      url: `${fhirConfig.baseUrl}/metadata`,
      version: '1.0.0',
      name: 'NAMASTECapabilityStatement',
      title: 'NAMASTE FHIR Server Capability Statement',
      status: 'active',
      experimental: false,
      date: new Date().toISOString(),
      publisher: fhirConfig.publisher || 'NAMASTE Project',
      description: 'Capability statement for NAMASTE traditional medicine terminology server',
      kind: 'instance',
      implementation: {
        description: 'NAMASTE Traditional Medicine Terminology Server',
        url: fhirConfig.baseUrl
      },
      fhirVersion: '4.0.1',
      format: ['json'],
      rest: [{
        mode: 'server',
        resource: [
          {
            type: 'CodeSystem',
            interaction: [
              { code: 'read' },
              { code: 'search-type' }
            ],
            searchParam: [
              {
                name: 'system',
                type: 'uri',
                documentation: 'Filter by system URI'
              }
            ]
          },
          {
            type: 'ConceptMap',
            interaction: [
              { code: 'read' },
              { code: 'search-type' }
            ]
          }
        ],
        operation: [
          {
            name: 'translate',
            definition: `${fhirConfig.baseUrl}/OperationDefinition/ConceptMap-translate`
          }
        ]
      }]
    };
  }
}

export default new FhirService();
