/**
 * AI-Enhanced Frontend Features - Prod                    <button type="button" id="aiMappingBtn" class="ai-feature-btn mapping">
                        <div class="ai-btn-icon"><i class="fas fa-map"></i></div>
                        <div class="ai-btn-content">
                            <h4>Smart Mapping</h4>
                            <p>Map traditional concepts to ICD-11 using AI</p>
                        </div>
                    </button>
                    
                    <button type="button" id="aiTranslateBtn" class="ai-feature-btn translation">
                        <div class="ai-btn-icon"><i class="fas fa-language"></i></div>
                        <div class="ai-btn-content">
                            <h4>AI Translation</h4>
                            <p>Translate concepts with cultural context</p>
                        </div>
                    </button>
                    
                    <button type="button" id="aiAnalysisBtn" class="ai-feature-btn analysis">* This file adds AI functionality to the frontend using the Gemini-powered backend
 */

// AI Feature Functions
class AIFeatures {
    constructor() {
        this.isAIEnabled = true;
        this.isInitialized = false;
    }

    // Initialize AI features in the UI
    initializeAIFeatures() {
        if (this.isInitialized) return;
        
        console.log('🤖 Initializing AI Features...');
        this.addAIPanel();
        this.attachEventListeners();
        this.isInitialized = true;
        console.log('✅ AI Features initialized successfully');
    }

    // Add the main AI panel to the UI
    addAIPanel() {
        console.log('🔧 Adding AI panel to UI...');
        
        // Remove any existing panel
        const existingPanel = document.querySelector('#ai-features-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        // Create the AI panel
        const aiPanel = document.createElement('div');
        aiPanel.id = 'ai-features-panel';
        aiPanel.className = 'ai-features-container';
        
        aiPanel.innerHTML = `
            <div class="ai-features-content">
                <h3><i class="fas fa-brain"></i> AI-Powered Medical Intelligence</h3>
                <p>Harness the power of AI for intelligent medical concept mapping and analysis</p>
                
                <div class="ai-buttons-grid">
                    <button id="aiMapBtn" class="ai-feature-btn mapping">
                        <div class="ai-btn-icon"><i class="fas fa-map-marked-alt"></i></div>
                        <div class="ai-btn-content">
                            <h4>Smart Mapping</h4>
                            <p>Map traditional concepts to ICD-11 using AI</p>
                        </div>
                    </button>
                    
                    <button id="aiTranslateBtn" class="ai-feature-btn translation">
                        <div class="ai-btn-icon"><i class="fas fa-language"></i></div>
                        <div class="ai-btn-content">
                            <h4>AI Translation</h4>
                            <p>Translate concepts with cultural context</p>
                        </div>
                    </button>
                    
                    <button id="aiAnalyzeBtn" class="ai-feature-btn analysis">
                        <div class="ai-btn-icon"><i class="fas fa-stethoscope"></i></div>
                        <div class="ai-btn-content">
                            <h4>Symptom Analysis</h4>
                            <p>AI-powered symptom assessment</p>
                        </div>
                    </button>
                </div>
            </div>
        `;
        
        // Insert after search container
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.parentNode.insertBefore(aiPanel, searchContainer.nextSibling);
            console.log('✅ AI panel inserted after search container');
        } else {
            const demoSection = document.querySelector('.demo-section');
            if (demoSection) {
                demoSection.insertBefore(aiPanel, demoSection.firstChild);
                console.log('✅ AI panel inserted at top of demo section');
            }
        }
    }

    // Attach event listeners to AI buttons
    attachEventListeners() {
        console.log('🔧 Attaching AI event listeners...');
        
        // AI button clicks with explicit event handling
        const mapBtn = document.getElementById('aiMapBtn');
        const translateBtn = document.getElementById('aiTranslateBtn'); 
        const analyzeBtn = document.getElementById('aiAnalyzeBtn');
        
        if (mapBtn) {
            mapBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openSmartMapping();
                return false;
            };
            console.log('✅ Smart mapping button listener attached');
        }
        
        if (translateBtn) {
            translateBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openAITranslation();
                return false;
            };
            console.log('✅ AI translation button listener attached');
        }
        
        if (analyzeBtn) {
            analyzeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openSymptomAnalysis();
                return false;
            };
            console.log('✅ Symptom analysis button listener attached');
        }
        
        console.log('✅ All AI event listeners attached successfully');
    }

    // Smart Mapping Feature
    openSmartMapping() {
        this.showAIDialog('Smart Concept Mapping', 'mapping', {
            inputs: [
                { 
                    id: 'mapConcept', 
                    label: 'Traditional Medicine Concept', 
                    type: 'text',
                    placeholder: 'e.g., Vata dosha imbalance, Pitta excess, Kapha stagnation',
                    value: selectedConcepts.length > 0 ? selectedConcepts[0].display : ''
                },
                { 
                    id: 'mapSourceSystem', 
                    label: 'Source System', 
                    type: 'select',
                    options: [
                        { value: 'ayurveda', text: 'Ayurveda' },
                        { value: 'siddha', text: 'Siddha' },
                        { value: 'unani', text: 'Unani' }
                    ]
                }
            ],
            action: 'Generate AI Mapping',
            icon: 'fas fa-map-marked-alt',
            color: '#4CAF50',
            onSubmit: (data) => this.performAIMapping(data)
        });
    }

    // AI Translation Feature  
    openAITranslation() {
        this.showAIDialog('AI-Powered Translation', 'translation', {
            inputs: [
                { 
                    id: 'translateConcept', 
                    label: 'Concept to Translate', 
                    type: 'text',
                    placeholder: 'e.g., Vata dosha, Pitta prakruti',
                    value: selectedConcepts.length > 0 ? selectedConcepts[0].display : ''
                },
                { 
                    id: 'sourceLanguage', 
                    label: 'From Language', 
                    type: 'select',
                    options: [
                        { value: 'en', text: 'English' },
                        { value: 'hi', text: 'Hindi' },
                        { value: 'sa', text: 'Sanskrit' },
                        { value: 'ta', text: 'Tamil' }
                    ]
                },
                { 
                    id: 'targetLanguage', 
                    label: 'To Language', 
                    type: 'select',
                    options: [
                        { value: 'hi', text: 'Hindi' },
                        { value: 'en', text: 'English' },
                        { value: 'sa', text: 'Sanskrit' },
                        { value: 'ta', text: 'Tamil' }
                    ]
                }
            ],
            action: 'Translate with AI',
            icon: 'fas fa-language',
            color: '#2196F3',
            onSubmit: (data) => this.performAITranslation(data)
        });
    }

    // Symptom Analysis Feature
    openSymptomAnalysis() {
        this.showAIDialog('AI Symptom Analysis', 'analysis', {
            inputs: [
                { 
                    id: 'symptoms', 
                    label: 'Symptoms (comma-separated)', 
                    type: 'textarea',
                    placeholder: 'e.g., headache, fatigue, digestive issues, anxiety, insomnia',
                    rows: 3
                },
                { 
                    id: 'analysisSystem', 
                    label: 'Medical System Perspective', 
                    type: 'select',
                    options: [
                        { value: 'ayurveda', text: 'Ayurveda' },
                        { value: 'siddha', text: 'Siddha' },
                        { value: 'unani', text: 'Unani' }
                    ]
                }
            ],
            action: 'Analyze with AI',
            icon: 'fas fa-stethoscope',
            color: '#FF9800',
            onSubmit: (data) => this.performAIAnalysis(data)
        });
    }

    // Generic AI dialog system
    showAIDialog(title, type, config) {
        // Create modal backdrop
        const modal = document.createElement('div');
        modal.className = 'ai-modal-backdrop';
        modal.innerHTML = `
            <div class="ai-modal">
                <div class="ai-modal-header" style="background: ${config.color}">
                    <h3><i class="${config.icon}"></i> ${title}</h3>
                    <button class="ai-modal-close">&times;</button>
                </div>
                <div class="ai-modal-body">
                    <form id="ai-form-${type}" class="ai-form">
                        ${config.inputs.map(input => this.renderInput(input)).join('')}
                        <button type="button" class="ai-submit-btn" style="background: ${config.color}">
                            <i class="${config.icon}"></i> ${config.action}
                        </button>
                    </form>
                    <div id="ai-results-${type}" class="ai-results"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners with safety checks
        const closeBtn = modal.querySelector('.ai-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.remove());
        }
        
        // Click outside to close (modal itself is the backdrop)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        const submitBtn = modal.querySelector('.ai-submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const form = modal.querySelector(`#ai-form-${type}`);
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                config.onSubmit(data);
            });
        }
    }

    // Render form inputs
    renderInput(input) {
        const baseClass = 'ai-input-group';
        
        if (input.type === 'select') {
            return `
                <div class="${baseClass}">
                    <label for="${input.id}">${input.label}</label>
                    <select name="${input.id}" id="${input.id}" required>
                        ${input.options.map(opt => 
                            `<option value="${opt.value}">${opt.text}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        } else if (input.type === 'textarea') {
            return `
                <div class="${baseClass}">
                    <label for="${input.id}">${input.label}</label>
                    <textarea name="${input.id}" id="${input.id}" rows="${input.rows || 3}" 
                              placeholder="${input.placeholder || ''}" required>${input.value || ''}</textarea>
                </div>
            `;
        } else {
            return `
                <div class="${baseClass}">
                    <label for="${input.id}">${input.label}</label>
                    <input type="${input.type}" name="${input.id}" id="${input.id}" 
                           placeholder="${input.placeholder || ''}" value="${input.value || ''}" required>
                </div>
            `;
        }
    }

    // AI API Calls
    async performAIMapping(data) {
        const resultsDiv = document.getElementById('ai-results-mapping');
        this.showLoading(resultsDiv, 'AI is analyzing concept mapping...');

        try {
            const response = await fetch('/api/terminology/map', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken || 'demo-token'}`
                },
                body: JSON.stringify({
                    concept: data.mapConcept,
                    sourceSystem: data.mapSourceSystem,
                    targetSystem: 'icd11',
                    confidence: 0.3
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.issue?.[0]?.details?.text || 'Mapping failed');
            }

            this.displayMappingResults(resultsDiv, result);

        } catch (error) {
            this.showError(resultsDiv, 'AI Mapping Error: ' + error.message);
        }
    }

    async performAITranslation(data) {
        const resultsDiv = document.getElementById('ai-results-translation');
        this.showLoading(resultsDiv, 'AI is translating concept...');

        try {
            const response = await fetch('/api/terminology/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken || 'demo-token'}`
                },
                body: JSON.stringify({
                    concept: data.translateConcept,
                    sourceLanguage: data.sourceLanguage,
                    targetLanguage: data.targetLanguage,
                    system: 'ayurveda'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.issue?.[0]?.details?.text || 'Translation failed');
            }

            this.displayTranslationResults(resultsDiv, result);

        } catch (error) {
            this.showError(resultsDiv, 'AI Translation Error: ' + error.message);
        }
    }

    async performAIAnalysis(data) {
        const resultsDiv = document.getElementById('ai-results-analysis');
        this.showLoading(resultsDiv, 'AI is analyzing symptoms...');

        try {
            const symptoms = data.symptoms.split(',').map(s => s.trim()).filter(s => s);
            
            const response = await fetch('/api/terminology/analyze-symptoms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken || 'demo-token'}`
                },
                body: JSON.stringify({
                    symptoms,
                    language: 'en',
                    system: data.analysisSystem
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.issue?.[0]?.details?.text || 'Analysis failed');
            }

            this.displayAnalysisResults(resultsDiv, result);

        } catch (error) {
            this.showError(resultsDiv, 'AI Analysis Error: ' + error.message);
        }
    }

    // Result Display Functions
    displayMappingResults(container, data) {
        container.innerHTML = `
            <div class="ai-success">
                <div class="success-header">
                    <i class="fas fa-check-circle"></i>
                    <h4>AI Mapping Successful</h4>
                </div>
                <div class="mapping-details">
                    <div class="detail-item">
                        <label>Concept Map:</label>
                        <span>${data.name || 'AI Generated Mapping'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-active">${data.status}</span>
                    </div>
                    <div class="detail-item">
                        <label>Source System:</label>
                        <span>${data.sourceUri || 'Traditional Medicine'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Target System:</label>
                        <span>${data.targetUri || 'ICD-11'}</span>
                    </div>
                </div>
                <div class="ai-actions">
                    <button onclick="this.addToSelectedConcepts('${data.name}')" class="ai-action-btn">
                        <i class="fas fa-plus"></i> Add to Selected
                    </button>
                    <button onclick="this.viewFHIRResource()" class="ai-action-btn secondary">
                        <i class="fas fa-code"></i> View FHIR
                    </button>
                </div>
            </div>
        `;
    }

    displayTranslationResults(container, data) {
        container.innerHTML = `
            <div class="ai-success">
                <div class="success-header">
                    <i class="fas fa-check-circle"></i>
                    <h4>AI Translation Complete</h4>
                </div>
                <div class="translation-result">
                    <div class="translation-pair">
                        <div class="translation-item original">
                            <label>Original:</label>
                            <div class="term-display">${data.originalTerm || 'Source concept'}</div>
                        </div>
                        <div class="translation-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                        <div class="translation-item translated">
                            <label>Translated:</label>
                            <div class="term-display">${data.translatedTerm || 'Translated concept'}</div>
                        </div>
                    </div>
                    <div class="confidence-display">
                        <label>AI Confidence:</label>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${(data.confidence || 0.7) * 100}%"></div>
                            <span class="confidence-text">${Math.round((data.confidence || 0.7) * 100)}%</span>
                        </div>
                    </div>
                    ${data.culturalContext ? `
                        <div class="cultural-context">
                            <label>Cultural Context:</label>
                            <p>${data.culturalContext}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    displayAnalysisResults(container, data) {
        container.innerHTML = `
            <div class="ai-success">
                <div class="success-header">
                    <i class="fas fa-check-circle"></i>
                    <h4>AI Analysis Complete</h4>
                </div>
                ${data.suggestedConditions ? `
                    <div class="conditions-section">
                        <h5>Suggested Conditions:</h5>
                        <div class="conditions-grid">
                            ${data.suggestedConditions.map(condition => `
                                <div class="condition-card severity-${condition.severity}">
                                    <div class="condition-header">
                                        <span class="condition-code">${condition.code}</span>
                                        <span class="severity-badge ${condition.severity}">${condition.severity}</span>
                                    </div>
                                    <div class="condition-name">${condition.display}</div>
                                    <div class="condition-explanation">${condition.explanation}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${data.recommendations ? `
                    <div class="recommendations-section">
                        <h5>AI Recommendations:</h5>
                        <div class="recommendations-content">
                            ${data.recommendations}
                        </div>
                    </div>
                ` : ''}
                
                <div class="ai-disclaimer">
                    <i class="fas fa-exclamation-triangle"></i>
                    <small>AI analysis is for informational purposes only. Consult qualified healthcare practitioners for proper diagnosis and treatment.</small>
                </div>
            </div>
        `;
    }

    // Utility functions
    showLoading(container, message) {
        container.innerHTML = `
            <div class="ai-loading">
                <div class="loading-animation">
                    <div class="loading-spinner"></div>
                </div>
                <p>${message}</p>
                <div class="loading-progress">
                    <div class="progress-bar"></div>
                </div>
            </div>
        `;
    }

    showError(container, message) {
        container.innerHTML = `
            <div class="ai-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h4>AI Operation Failed</h4>
                <p>${message}</p>
                <button onclick="this.parentElement.innerHTML=''" class="retry-btn">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Initialize AI features - Make instance globally accessible
let aiFeatures = null;

// Initialize when DOM is loaded and dashboard is visible
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 AI Features (Production) script loaded');
    
    // Create global instance
    aiFeatures = new AIFeatures();
    
    const initAI = () => {
        const dashboard = document.getElementById('dashboardSection');
        if (dashboard && dashboard.style.display !== 'none') {
            aiFeatures.initializeAIFeatures();
            return true;
        }
        return false;
    };

    // Try immediate init
    if (!initAI()) {
        // Check periodically
        const checkInterval = setInterval(() => {
            if (initAI()) {
                clearInterval(checkInterval);
            }
        }, 500);
        
        setTimeout(() => clearInterval(checkInterval), 15000);
    }
});

// Manual initialization function
window.initializeAIFeatures = () => {
    console.log('🔄 Manual AI features initialization');
    if (!aiFeatures) {
        aiFeatures = new AIFeatures();
    }
    aiFeatures.initializeAIFeatures();
};

// Global access
window.aiFeatures = aiFeatures;