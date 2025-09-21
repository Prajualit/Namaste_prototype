import logger from "../utils/logger.js";

/**
 * AI Service for concept mapping using Gemini API
 * This replaces static CSV mappings with intelligent AI-powered mappings
 */
class AiService {
  constructor() {
    // Lazy-load configuration to avoid env loading timing issues
    this._initialized = false;
    this.apiKey = null;
    this.apiUrl = null;
    this.model = null;
  }

  /**
   * Initialize configuration (lazy-loaded)
   * @private
   */
  _initializeConfig() {
    if (this._initialized) return;
    
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.apiUrl =
      process.env.GEMINI_API_URL ||
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    this.model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    if (!this.apiKey) {
      logger.warn(
        "GEMINI_API_KEY not configured - AI mapping will use fallback responses"
      );
    } else {
      logger.info(`AI Service initialized with Gemini API (${this.model})`);
    }
    
    this._initialized = true;
  }

  /**
   * Map traditional medicine concept to ICD-11 using Gemini AI
   * @param {string} concept - Traditional medicine concept (e.g., "vata imbalance", "pitta excess")
   * @param {string} system - Medicine system ('ayurveda', 'siddha', 'unani')
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Mapping result with confidence score
   */
  async mapTraditionalToICD11(concept, system = "ayurveda", options = {}) {
    this._initializeConfig(); // Lazy-load configuration
    
    try {
      const prompt = this.buildMappingPrompt(concept, system, options);
      const response = await this.callGeminiAPI(prompt);
      const mappings = this.parseMappingResponse(response, concept, system);

      // Return the best mapping (first one) as an object
      return mappings.length > 0
        ? mappings[0]
        : this.getFallbackMapping(concept, system)[0];
    } catch (error) {
      logger.error("AI mapping error:", error);
      return this.getFallbackMapping(concept, system)[0];
    }
  }

  /**
   * Translate concept between languages
   * @param {string} concept - Concept to translate
   * @param {string} sourceLanguage - Source language code
   * @param {string} targetLanguage - Target language code
   * @param {string} system - Medicine system context
   * @returns {Promise<Object>} Translation result
   */
  async translateConcept(
    concept,
    sourceLanguage,
    targetLanguage,
    system = "ayurveda"
  ) {
    this._initializeConfig(); // Lazy-load configuration
    
    try {
      const prompt = `Translate the ${system} medicine concept "${concept}" from ${sourceLanguage} to ${targetLanguage}. 
      Consider cultural and medical context. Provide translation confidence score (0-1) and cultural context notes.
      
      Return JSON format:
      {
        "translatedTerm": "translated concept",
        "confidence": 0.85,
        "culturalContext": "explanation of cultural/medical context"
      }`;

      const response = await this.callGeminiAPI(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback
      return {
        translatedTerm: concept, // No translation available
        confidence: 0.3,
        culturalContext: "Translation not available - using original term",
      };
    } catch (error) {
      logger.error("AI translation error:", error);
      return {
        translatedTerm: concept,
        confidence: 0.3,
        culturalContext: "Translation failed - using original term",
      };
    }
  }

  /**
   * Analyze symptoms and suggest conditions
   * @param {Array} symptoms - Array of symptom strings
   * @param {string} language - Language for analysis
   * @param {string} system - Medicine system to use
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeSymptoms(symptoms, language = "en", system = "ayurveda") {
    this._initializeConfig(); // Lazy-load configuration
    
    try {
      const prompt = `Analyze these symptoms from a ${system} medicine perspective: ${symptoms.join(
        ", "
      )}.
      Suggest possible conditions/diagnoses and recommendations in ${language}.
      
      Return JSON format:
      {
        "suggestedConditions": [
          {
            "code": "condition_code",
            "display": "Condition Name",
            "severity": "mild|moderate|severe",
            "explanation": "explanation"
          }
        ],
        "recommendations": "general recommendations"
      }`;

      const response = await this.callGeminiAPI(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback
      return {
        suggestedConditions: [
          {
            code: "unknown",
            display: "Analysis not available",
            severity: "moderate",
            explanation: "AI analysis failed - fallback response",
          },
        ],
        recommendations:
          "Consult a qualified healthcare practitioner for proper diagnosis and treatment.",
      };
    } catch (error) {
      logger.error("AI symptom analysis error:", error);
      return {
        suggestedConditions: [
          {
            code: "error",
            display: "Analysis error",
            severity: "moderate",
            explanation: "AI analysis failed due to technical error",
          },
        ],
        recommendations:
          "Please try again or consult a healthcare practitioner.",
      };
    }
  }

  /**
   * Search for similar concepts
   * @param {string} query - Search query
   * @param {string} system - Medicine system
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} Array of similar concepts
   */
  async searchSimilarConcepts(query, system = "ayurveda", limit = 10) {
    this._initializeConfig(); // Lazy-load configuration
    
    try {
      const prompt = `Find ${limit} ${system} medicine concepts similar to "${query}".
      Return array of concepts with codes and definitions.
      
      Return JSON format:
      [
        {
          "code": "concept_code",
          "display": "Concept Name",
          "definition": "concept definition",
          "system": "${system}"
        }
      ]`;

      const response = await this.callGeminiAPI(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback
      return [
        {
          code: `${system}_001`,
          display: "Sample Concept",
          definition: "AI search not available - fallback concept",
          system: system,
        },
      ];
    } catch (error) {
      logger.error("AI concept search error:", error);
      return [
        {
          code: `${system}_error`,
          display: "Search Error",
          definition: "AI concept search failed",
          system: system,
        },
      ];
    }
  }

  /**
   * Validate concept mapping
   * @param {Object} mapping - Mapping to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateMapping(mapping) {
    // Simple validation for now - in real implementation would use AI
    return {
      isValid: true,
      confidence: mapping.confidence || 0.5,
      issues: [],
    };
  }

  /**
   * Generate FHIR CapabilityStatement
   * @returns {Promise<Object>} FHIR CapabilityStatement
   */
  async generateCapabilityStatement() {
    // For now, return a basic capability statement
    // In real implementation, could use AI to generate dynamic capabilities
    return {
      resourceType: "CapabilityStatement",
      id: "namaste-capability",
      url: "http://localhost:3000/fhir/metadata",
      version: "1.0.0",
      name: "NAMASTECapabilityStatement",
      title: "NAMASTE FHIR Server Capability Statement (AI-Enhanced)",
      status: "active",
      date: new Date().toISOString().split("T")[0],
      publisher: "NAMASTE Project",
      description:
        "AI-enhanced FHIR server for traditional medicine interoperability",
      kind: "instance",
      software: {
        name: "NAMASTE FHIR Server",
        version: "1.0.0",
      },
      fhirVersion: "4.0.1",
      format: ["json", "xml"],
      rest: [
        {
          mode: "server",
          resource: [
            {
              type: "CodeSystem",
              interaction: [{ code: "read" }, { code: "search-type" }],
            },
            {
              type: "ConceptMap",
              interaction: [{ code: "read" }, { code: "search-type" }],
            },
          ],
        },
      ],
    };
  }

  /**
   * Map traditional medicine concept to ICD-11 using Gemini AI
   * @param {string} concept - Traditional medicine concept (e.g., "vata imbalance", "pitta excess")
   * @param {string} system - Medicine system ('ayurveda', 'siddha', 'unani')
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Array of mapping suggestions
   */
  async mapConceptToICD11(concept, system = "ayurveda", options = {}) {
    this._initializeConfig(); // Lazy-load configuration
    
    try {
      const prompt = this.buildMappingPrompt(concept, system, options);
      const response = await this.callGeminiAPI(prompt);

      return this.parseMappingResponse(response, concept, system);
    } catch (error) {
      logger.error("AI concept mapping failed:", error);
      return this.getFallbackMapping(concept, system);
    }
  }

  /**
   * Generate FHIR CodeSystem using AI
   * @param {string} system - Medicine system
   * @param {Array} concepts - Array of concepts to include
   * @returns {Promise<Object>} FHIR CodeSystem resource
   */
  async generateCodeSystem(system, concepts = []) {
    this._initializeConfig(); // Lazy-load configuration
    
    try {
      const prompt = this.buildCodeSystemPrompt(system, concepts);
      const response = await this.callGeminiAPI(prompt);

      return this.parseCodeSystemResponse(response, system);
    } catch (error) {
      logger.error("AI CodeSystem generation failed:", error);
      return this.getFallbackCodeSystem(system);
    }
  }

  /**
   * Generate concept mappings using AI
   * @param {string} sourceSystem - Source system (ayurveda, siddha, unani)
   * @param {string} targetSystem - Target system (icd11)
   * @param {Array} concepts - Concepts to map
   * @returns {Promise<Array>} Array of concept mappings
   */
  async generateConceptMappings(
    sourceSystem,
    targetSystem = "icd11",
    concepts = []
  ) {
    this._initializeConfig(); // Lazy-load configuration
    
    try {
      const prompt = this.buildConceptMappingsPrompt(
        sourceSystem,
        targetSystem,
        concepts
      );
      const response = await this.callGeminiAPI(prompt);

      return this.parseConceptMappingsResponse(response, sourceSystem);
    } catch (error) {
      logger.error("AI concept mappings generation failed:", error);
      return this.getFallbackConceptMappings(sourceSystem);
    }
  }

  /**
   * Call Gemini API with the given prompt
   * @private
   */
  async callGeminiAPI(prompt) {
    this._initializeConfig(); // Ensure configuration is loaded
    
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent medical mappings
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from Gemini API");
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Build prompt for concept mapping
   * @private
   */
  buildMappingPrompt(concept, system, options) {
    return `You are an expert medical terminology specialist with deep knowledge of traditional medicine systems and ICD-11.

Task: Map the following ${system} concept to appropriate ICD-11 codes.

Input Concept: "${concept}"
Source System: ${system}
Target System: ICD-11

Please provide up to 3 best mapping suggestions in the following JSON format:
[
  {
    "icd11Code": "ICD-11 code",
    "relationship": "equivalent|related-to|source-is-narrower-than-target|source-is-broader-than-target",
    "confidenceScore": 0.85,
    "comment": "Brief explanation of the mapping rationale",
    "clinicalContext": "Clinical context where this mapping applies"
  }
]

Guidelines:
- Use actual ICD-11 codes (format: XX##.# or similar)
- Confidence scores should be realistic (0.6-0.95 range)
- Consider the holistic nature of traditional medicine concepts
- Provide clear, medical rationale for each mapping
- Focus on the most clinically relevant mappings

Return only valid JSON, no other text.`;
  }

  /**
   * Build prompt for CodeSystem generation
   * @private
   */
  buildCodeSystemPrompt(system, concepts) {
    return `Generate a FHIR R4 CodeSystem resource for ${system} traditional medicine concepts.

System: ${system}
${
  concepts.length > 0
    ? `Include these specific concepts: ${concepts.join(", ")}`
    : "Include common concepts from this system"
}

Requirements:
- Valid FHIR R4 CodeSystem resource
- Appropriate system URL and identifier
- At least 10-15 relevant concepts
- Include proper display names and definitions
- Use appropriate concept codes (e.g., AY001, SI001, UN001 format)
- Include hierarchical relationships where applicable

Return only valid JSON FHIR resource, no other text.`;
  }

  /**
   * Build prompt for concept mappings generation
   * @private
   */
  buildConceptMappingsPrompt(sourceSystem, targetSystem, concepts) {
    return `Generate concept mappings between ${sourceSystem} and ${targetSystem}.

Create mappings for common ${sourceSystem} concepts to ${targetSystem} codes.
${concepts.length > 0 ? `Focus on these concepts: ${concepts.join(", ")}` : ""}

Return JSON array with this structure:
[
  {
    "namasteCode": "concept code",
    "icd11Code": "target code", 
    "relationship": "relationship type",
    "confidenceScore": 0.75,
    "comment": "mapping explanation"
  }
]

Include 10-15 realistic mappings with proper medical rationale.
Return only valid JSON, no other text.`;
  }

  /**
   * Parse AI response for concept mapping
   * @private
   */
  parseMappingResponse(response, concept, system) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const mappings = JSON.parse(jsonMatch[0]);
        return mappings.map((mapping) => ({
          ...mapping,
          sourceConcept: concept,
          sourceSystem: system,
          source: "ai",
          timestamp: new Date().toISOString(),
        }));
      }

      // If no JSON found, return fallback
      logger.warn("Could not parse AI mapping response, using fallback");
      return this.getFallbackMapping(concept, system);
    } catch (error) {
      logger.error("Error parsing AI mapping response:", error);
      return this.getFallbackMapping(concept, system);
    }
  }

  /**
   * Parse AI response for CodeSystem
   * @private
   */
  parseCodeSystemResponse(response, system) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getFallbackCodeSystem(system);
    } catch (error) {
      logger.error("Error parsing AI CodeSystem response:", error);
      return this.getFallbackCodeSystem(system);
    }
  }

  /**
   * Parse AI response for concept mappings
   * @private
   */
  parseConceptMappingsResponse(response, sourceSystem) {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const mappings = JSON.parse(jsonMatch[0]);
        return mappings.map((mapping) => ({
          ...mapping,
          source: "ai",
          sourceSystem,
          timestamp: new Date().toISOString(),
        }));
      }
      return this.getFallbackConceptMappings(sourceSystem);
    } catch (error) {
      logger.error("Error parsing AI concept mappings response:", error);
      return this.getFallbackConceptMappings(sourceSystem);
    }
  }

  /**
   * Fallback mapping when AI fails
   * @private
   */
  getFallbackMapping(concept, system) {
    const fallbackMappings = {
      vata: [
        {
          icd11Code: "MD90.0",
          relationship: "related-to",
          confidenceScore: 0.7,
          comment:
            "Vata imbalance often correlates with anxiety and nervous system disorders",
          sourceConcept: concept,
          sourceSystem: system,
          source: "fallback",
        },
      ],
      pitta: [
        {
          icd11Code: "MG30.0",
          relationship: "related-to",
          confidenceScore: 0.68,
          comment:
            "Pitta excess can manifest as hypertension and cardiovascular issues",
          sourceConcept: concept,
          sourceSystem: system,
          source: "fallback",
        },
      ],
      kapha: [
        {
          icd11Code: "ME84.1",
          relationship: "related-to",
          confidenceScore: 0.72,
          comment: "Kapha stagnation similar to chronic fatigue syndromes",
          sourceConcept: concept,
          sourceSystem: system,
          source: "fallback",
        },
      ],
    };

    const key = Object.keys(fallbackMappings).find((k) =>
      concept.toLowerCase().includes(k)
    );
    return key
      ? fallbackMappings[key]
      : [
          {
            icd11Code: "MG30.Z",
            relationship: "related-to",
            confidenceScore: 0.5,
            comment: "General mapping - requires manual review",
            sourceConcept: concept,
            sourceSystem: system,
            source: "fallback",
          },
        ];
  }

  /**
   * Fallback mapping when AI fails
   * @private
   */
  getFallbackMapping(concept, system) {
    return [
      {
        targetCode: "MG30.Z",
        targetDisplay: "Other specified disorder",
        sourceCode: concept.toLowerCase().replace(/\s+/g, "-"),
        confidence: 0.5,
        explanation: `Fallback mapping for ${system} concept: ${concept}. AI mapping unavailable.`,
      },
    ];
  }

  /**
   * Fallback CodeSystem when AI fails
   * @private
   */
  getFallbackCodeSystem(system) {
    return {
      resourceType: "CodeSystem",
      id: `namaste-${system}`,
      url: `https://namaste.gov.in/fhir/CodeSystem/${system}`,
      version: "1.0.0",
      name: `NAMASTE_${system.toUpperCase()}`,
      title: `NAMASTE ${
        system.charAt(0).toUpperCase() + system.slice(1)
      } Concepts`,
      status: "active",
      date: new Date().toISOString().split("T")[0],
      publisher: "NAMASTE Project",
      description: `Traditional ${system} medicine concepts for interoperability`,
      concept: [
        {
          code: `${system.substring(0, 2).toUpperCase()}001`,
          display: "Sample Concept",
          definition: "Fallback concept generated when AI is unavailable",
        },
      ],
    };
  }

  /**
   * Fallback concept mappings when AI fails
   * @private
   */
  getFallbackConceptMappings(sourceSystem) {
    return [
      {
        namasteCode: `${sourceSystem.substring(0, 2).toUpperCase()}001`,
        icd11Code: "MG30.Z",
        relationship: "related-to",
        confidenceScore: 0.5,
        comment: "Fallback mapping - AI unavailable",
        source: "fallback",
        sourceSystem,
      },
    ];
  }
}

export default new AiService();
