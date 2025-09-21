/**
 * AI-Enhanced Frontend Features
 * This file adds AI functionality to the frontend using the Gemini-powered backend
 */

// AI Feature Functions
class AIFeatures {
    constructor() {
        this.isAIEnabled = true;
        this.loadingIndicators = new Map();
    }

    // Initialize AI features in the UI
    initializeAIFeatures() {
        console.log('🤖 Initializing AI Features...');
        this.addAIButtons();
        this.addAIModals();
        this.attachAIEventListeners();
        console.log('✅ AI Features initialized successfully');
    }

    // Add AI-powered buttons to the UI
    addAIButtons() {
        console.log('🔧 Adding AI buttons to UI...');
        const aiButtonsContainer = document.createElement('div');
        aiButtonsContainer.className = 'ai-features-container';
        aiButtonsContainer.innerHTML = `
            <div class="ai-features-panel">
                <h3><i class="fas fa-brain"></i> AI-Powered Features</h3>
                <div class="ai-buttons">
                    <button id="aiMapBtn" class="ai-btn primary" title="Map traditional concepts to ICD-11">
                        <i class="fas fa-map-marked-alt"></i> Smart Mapping
                    </button>
                    <button id="aiTranslateBtn" class="ai-btn secondary" title="Translate concepts between languages">
                        <i class="fas fa-language"></i> AI Translation
                    </button>
                    <button id="aiAnalyzeBtn" class="ai-btn tertiary" title="Analyze symptoms with AI">
                        <i class="fas fa-stethoscope"></i> Symptom Analysis
                    </button>
                </div>
                <div class="ai-status">
                    <span id="aiStatus" class="status-indicator active">
                        <i class="fas fa-circle"></i> AI Ready
                    </span>
                </div>
            </div>
        `;

        // Insert after the search section
        const searchSection = document.querySelector('.search-container');
        if (searchSection) {
            searchSection.parentNode.insertBefore(aiButtonsContainer, searchSection.nextSibling);
        } else {
            // Fallback: insert at the beginning of demo-section
            const demoSection = document.querySelector('.demo-section');
            if (demoSection) {
                demoSection.insertBefore(aiButtonsContainer, demoSection.firstChild);
                console.log('✅ AI panel inserted into demo-section');
            } else {
                console.error('❌ Could not find demo-section to insert AI panel');
            }
        }
    }

    // Add modals for AI interactions
    addAIModals() {
        const modalsHTML = `
            <!-- AI Mapping Modal -->
            <div id="aiMappingModal" class="ai-modal">
                <div class="ai-modal-content">
                    <div class="ai-modal-header">
                        <h3><i class="fas fa-map-marked-alt"></i> AI Concept Mapping</h3>
                        <button class="ai-modal-close">&times;</button>
                    </div>
                    <div class="ai-modal-body">
                        <div class="input-group">
                            <label for="mapConcept">Traditional Medicine Concept:</label>
                            <input type="text" id="mapConcept" placeholder="e.g., Vata dosha imbalance, Pitta excess" />
                        </div>
                        <div class="input-group">
                            <label for="mapSourceSystem">Source System:</label>
                            <select id="mapSourceSystem">
                                <option value="ayurveda">Ayurveda</option>
                                <option value="siddha">Siddha</option>
                                <option value="unani">Unani</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label for="mapTargetSystem">Target System:</label>
                            <select id="mapTargetSystem">
                                <option value="icd11">ICD-11</option>
                            </select>
                        </div>
                        <button id="performMapping" class="ai-btn primary">
                            <i class="fas fa-cogs"></i> Generate Mapping
                        </button>
                        <div id="mappingResults" class="ai-results"></div>
                    </div>
                </div>
            </div>

            <!-- AI Translation Modal -->
            <div id="aiTranslationModal" class="ai-modal">
                <div class="ai-modal-content">
                    <div class="ai-modal-header">
                        <h3><i class="fas fa-language"></i> AI Concept Translation</h3>
                        <button class="ai-modal-close">&times;</button>
                    </div>
                    <div class="ai-modal-body">
                        <div class="input-group">
                            <label for="translateConcept">Concept to Translate:</label>
                            <input type="text" id="translateConcept" placeholder="e.g., Vata dosha" />
                        </div>
                        <div class="translation-languages">
                            <div class="input-group">
                                <label for="sourceLanguage">From:</label>
                                <select id="sourceLanguage">
                                    <option value="en">English</option>
                                    <option value="hi">Hindi</option>
                                    <option value="sa">Sanskrit</option>
                                    <option value="ta">Tamil</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label for="targetLanguage">To:</label>
                                <select id="targetLanguage">
                                    <option value="hi">Hindi</option>
                                    <option value="en">English</option>
                                    <option value="sa">Sanskrit</option>
                                    <option value="ta">Tamil</option>
                                </select>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="translationSystem">Medical System Context:</label>
                            <select id="translationSystem">
                                <option value="ayurveda">Ayurveda</option>
                                <option value="siddha">Siddha</option>
                                <option value="unani">Unani</option>
                            </select>
                        </div>
                        <button id="performTranslation" class="ai-btn primary">
                            <i class="fas fa-language"></i> Translate
                        </button>
                        <div id="translationResults" class="ai-results"></div>
                    </div>
                </div>
            </div>

            <!-- AI Symptom Analysis Modal -->
            <div id="aiAnalysisModal" class="ai-modal">
                <div class="ai-modal-content">
                    <div class="ai-modal-header">
                        <h3><i class="fas fa-stethoscope"></i> AI Symptom Analysis</h3>
                        <button class="ai-modal-close">&times;</button>
                    </div>
                    <div class="ai-modal-body">
                        <div class="input-group">
                            <label for="symptomsInput">Enter Symptoms (comma-separated):</label>
                            <textarea id="symptomsInput" rows="4" 
                                placeholder="e.g., headache, fatigue, digestive issues, anxiety"></textarea>
                        </div>
                        <div class="input-group">
                            <label for="analysisLanguage">Analysis Language:</label>
                            <select id="analysisLanguage">
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label for="analysisSystem">Medical System Perspective:</label>
                            <select id="analysisSystem">
                                <option value="ayurveda">Ayurveda</option>
                                <option value="siddha">Siddha</option>
                                <option value="unani">Unani</option>
                            </select>
                        </div>
                        <button id="performAnalysis" class="ai-btn primary">
                            <i class="fas fa-search-plus"></i> Analyze Symptoms
                        </button>
                        <div id="analysisResults" class="ai-results"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalsHTML);
    }

    // Attach event listeners for AI features
    attachAIEventListeners() {
        // AI button clicks
        document.getElementById('aiMapBtn')?.addEventListener('click', () => this.openMappingModal());
        document.getElementById('aiTranslateBtn')?.addEventListener('click', () => this.openTranslationModal());
        document.getElementById('aiAnalyzeBtn')?.addEventListener('click', () => this.openAnalysisModal());

        // Modal actions
        document.getElementById('performMapping')?.addEventListener('click', () => this.performAIMapping());
        document.getElementById('performTranslation')?.addEventListener('click', () => this.performAITranslation());
        document.getElementById('performAnalysis')?.addEventListener('click', () => this.performAIAnalysis());

        // Modal close handlers
        document.querySelectorAll('.ai-modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.ai-modal')));
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('ai-modal')) {
                this.closeModal(e.target);
            }
        });
    }

    // Modal management
    openMappingModal() {
        const modal = document.getElementById('aiMappingModal');
        modal.style.display = 'block';
        // Pre-fill if there's a selected concept
        if (selectedConcepts.length > 0) {
            document.getElementById('mapConcept').value = selectedConcepts[0].display;
        }
    }

    openTranslationModal() {
        const modal = document.getElementById('aiTranslationModal');
        modal.style.display = 'block';
        if (selectedConcepts.length > 0) {
            document.getElementById('translateConcept').value = selectedConcepts[0].display;
        }
    }

    openAnalysisModal() {
        const modal = document.getElementById('aiAnalysisModal');
        modal.style.display = 'block';
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            // Clear results
            modal.querySelector('.ai-results')?.innerHTML = '';
        }
    }

    // AI API Calls
    async performAIMapping() {
        const concept = document.getElementById('mapConcept').value.trim();
        const sourceSystem = document.getElementById('mapSourceSystem').value;
        const targetSystem = document.getElementById('mapTargetSystem').value;
        const resultsDiv = document.getElementById('mappingResults');

        if (!concept) {
            this.showAIError(resultsDiv, 'Please enter a concept to map');
            return;
        }

        if (!authToken) {
            this.showAIError(resultsDiv, 'Please login first');
            return;
        }

        try {
            this.showAILoading(resultsDiv, 'AI is analyzing concept mapping...');

            const response = await fetch('/api/terminology/map', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    concept,
                    sourceSystem,
                    targetSystem,
                    confidence: 0.3
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.issue?.[0]?.details?.text || 'Mapping failed');
            }

            this.displayMappingResults(resultsDiv, data);

        } catch (error) {
            this.showAIError(resultsDiv, 'AI Mapping Error: ' + error.message);
        }
    }

    async performAITranslation() {
        const concept = document.getElementById('translateConcept').value.trim();
        const sourceLanguage = document.getElementById('sourceLanguage').value;
        const targetLanguage = document.getElementById('targetLanguage').value;
        const system = document.getElementById('translationSystem').value;
        const resultsDiv = document.getElementById('translationResults');

        if (!concept) {
            this.showAIError(resultsDiv, 'Please enter a concept to translate');
            return;
        }

        if (!authToken) {
            this.showAIError(resultsDiv, 'Please login first');
            return;
        }

        try {
            this.showAILoading(resultsDiv, 'AI is translating concept...');

            const response = await fetch('/api/terminology/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    concept,
                    sourceLanguage,
                    targetLanguage,
                    system
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.issue?.[0]?.details?.text || 'Translation failed');
            }

            this.displayTranslationResults(resultsDiv, data);

        } catch (error) {
            this.showAIError(resultsDiv, 'AI Translation Error: ' + error.message);
        }
    }

    async performAIAnalysis() {
        const symptomsText = document.getElementById('symptomsInput').value.trim();
        const language = document.getElementById('analysisLanguage').value;
        const system = document.getElementById('analysisSystem').value;
        const resultsDiv = document.getElementById('analysisResults');

        if (!symptomsText) {
            this.showAIError(resultsDiv, 'Please enter symptoms to analyze');
            return;
        }

        if (!authToken) {
            this.showAIError(resultsDiv, 'Please login first');
            return;
        }

        try {
            this.showAILoading(resultsDiv, 'AI is analyzing symptoms...');

            const symptoms = symptomsText.split(',').map(s => s.trim()).filter(s => s);

            const response = await fetch('/api/terminology/analyze-symptoms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    symptoms,
                    language,
                    system
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.issue?.[0]?.details?.text || 'Analysis failed');
            }

            this.displayAnalysisResults(resultsDiv, data);

        } catch (error) {
            this.showAIError(resultsDiv, 'AI Analysis Error: ' + error.message);
        }
    }

    // Result Display Functions
    displayMappingResults(container, data) {
        const mappings = data.group?.[0]?.element?.[0]?.target || [];
        
        container.innerHTML = `
            <div class="ai-success">
                <h4><i class="fas fa-check-circle"></i> AI Mapping Results</h4>
                <div class="mapping-info">
                    <p><strong>Source:</strong> ${data.name || 'Concept Mapping'}</p>
                    <p><strong>Status:</strong> <span class="status-active">${data.status}</span></p>
                </div>
                ${mappings.length > 0 ? `
                    <div class="mapping-targets">
                        <h5>Mapped Concepts:</h5>
                        ${mappings.map(target => `
                            <div class="mapping-result">
                                <span class="equivalence-badge ${target.equivalence}">
                                    ${target.equivalence}
                                </span>
                                <div class="mapping-details">
                                    <strong>Target System:</strong> ICD-11<br>
                                    <strong>Relationship:</strong> ${target.equivalence}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>No specific mappings found, but FHIR ConceptMap created successfully.</p>'}
                <button onclick="aiFeatures.addMappingToSelected('${data.name}')" class="ai-btn secondary">
                    <i class="fas fa-plus"></i> Add to Selected Concepts
                </button>
            </div>
        `;
    }

    displayTranslationResults(container, translationData) {
        container.innerHTML = `
            <div class="ai-success">
                <h4><i class="fas fa-check-circle"></i> AI Translation Results</h4>
                <div class="translation-result">
                    <div class="translation-pair">
                        <div class="original-term">
                            <label>Original:</label>
                            <div class="term-box">${translationData.originalTerm || 'N/A'}</div>
                        </div>
                        <div class="translation-arrow">→</div>
                        <div class="translated-term">
                            <label>Translated:</label>
                            <div class="term-box">${translationData.translatedTerm || 'Translation unavailable'}</div>
                        </div>
                    </div>
                    <div class="confidence-score">
                        <label>Confidence:</label>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${(translationData.confidence || 0.5) * 100}%"></div>
                            <span class="confidence-text">${Math.round((translationData.confidence || 0.5) * 100)}%</span>
                        </div>
                    </div>
                    ${translationData.culturalContext ? `
                        <div class="cultural-context">
                            <label>Cultural Context:</label>
                            <p>${translationData.culturalContext}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    displayAnalysisResults(container, analysisData) {
        container.innerHTML = `
            <div class="ai-success">
                <h4><i class="fas fa-check-circle"></i> AI Symptom Analysis</h4>
                <div class="analysis-results">
                    ${analysisData.suggestedConditions ? `
                        <div class="suggested-conditions">
                            <h5>Suggested Conditions:</h5>
                            ${analysisData.suggestedConditions.map(condition => `
                                <div class="condition-card ${condition.severity}">
                                    <div class="condition-header">
                                        <span class="condition-code">${condition.code}</span>
                                        <span class="severity-badge ${condition.severity}">${condition.severity}</span>
                                    </div>
                                    <div class="condition-name">${condition.display}</div>
                                    <div class="condition-explanation">${condition.explanation}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${analysisData.recommendations ? `
                        <div class="ai-recommendations">
                            <h5>AI Recommendations:</h5>
                            <div class="recommendations-box">
                                ${analysisData.recommendations}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="disclaimer">
                    <i class="fas fa-exclamation-triangle"></i>
                    <small>This AI analysis is for informational purposes only. Please consult qualified healthcare practitioners for proper diagnosis and treatment.</small>
                </div>
            </div>
        `;
    }

    // Utility functions
    showAILoading(container, message) {
        container.innerHTML = `
            <div class="ai-loading">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>${message}</p>
                <div class="loading-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
    }

    showAIError(container, message) {
        container.innerHTML = `
            <div class="ai-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    addMappingToSelected(mappingName) {
        showSuccess(`Mapping "${mappingName}" processed successfully! Check the FHIR data for details.`);
    }
}

// Initialize AI features when DOM is loaded
const aiFeatures = new AIFeatures();

document.addEventListener('DOMContentLoaded', () => {
    // Initialize immediately, but also set up a check for when dashboard becomes visible
    console.log('📱 AI Features script loaded');
    
    // Try to initialize immediately if dashboard is visible
    const tryInitializeAI = () => {
        const dashboardSection = document.getElementById('dashboardSection');
        if (dashboardSection && dashboardSection.style.display !== 'none') {
            console.log('🎯 Dashboard is visible, initializing AI features...');
            aiFeatures.initializeAIFeatures();
            return true;
        }
        return false;
    };
    
    // Try immediate initialization
    if (!tryInitializeAI()) {
        // If not ready, check periodically
        const checkInterval = setInterval(() => {
            if (tryInitializeAI()) {
                clearInterval(checkInterval);
            }
        }, 500);
        
        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
});

// Also expose a function to manually initialize AI features
window.initializeAIFeatures = () => {
    console.log('🔄 Manual AI features initialization triggered');
    aiFeatures.initializeAIFeatures();
};

// Make aiFeatures globally available
window.aiFeatures = aiFeatures;