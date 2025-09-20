// Global state
let selectedConcepts = [];

// DOM elements  
const searchInput = document.getElementById('searchInput');
const systemSelect = document.getElementById('systemSelect');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const selectedConceptsContainer = document.getElementById('selectedConcepts');
const generateBundleBtn = document.getElementById('generateBundle');
const patientIdInput = document.getElementById('patientId');
const fhirBundleContainer = document.getElementById('fhirBundle');

// Event listeners
searchBtn.addEventListener('click', performSearch);
generateBundleBtn.addEventListener('click', generateBundle);

// Demo scenario buttons
document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const scenario = e.target.dataset.scenario;
        runDemoScenario(scenario);
    });
});

// Search functionality
async function performSearch() {
    const query = searchInput.value.trim();
    const system = systemSelect.value;
    
    if (query.length < 2) {
        showError('Please enter at least 2 characters to search');
        return;
    }
    
    try {
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        searchBtn.disabled = true;
        
        // Use demo token for authentication
        const response = await fetch(`/api/terminology/lookup?q=${encodeURIComponent(query)}&system=${system}`, {
            headers: {
                'Authorization': 'Bearer demo-token-12345'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.issue?.[0]?.details?.text || 'Search failed');
        }
        
        const data = await response.json();
        displaySearchResults(data);
        
    } catch (error) {
        showError('Search error: ' + error.message);
        // Show some demo data if API fails
        showDemoResults(query);
    } finally {
        searchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
        searchBtn.disabled = false;
    }
}

// Show demo results when API is not working
function showDemoResults(query) {
    const demoData = [
        {
            code: 'AY001',
            display: 'Vata Dosha Imbalance',
            system: 'http://terminology.gov.in/namaste/ayurveda',
            definition: 'Imbalance in Vata dosha causing various symptoms'
        },
        {
            code: 'AY002', 
            display: 'Pitta Dosha Excess',
            system: 'http://terminology.gov.in/namaste/ayurveda',
            definition: 'Excessive Pitta dosha manifestation'
        },
        {
            code: 'SI001',
            display: 'Vatha Kalam Disorder', 
            system: 'http://terminology.gov.in/namaste/siddha',
            definition: 'Siddha medicine Vatha humor imbalance'
        }
    ].filter(item => 
        item.display.toLowerCase().includes(query.toLowerCase()) ||
        item.code.toLowerCase().includes(query.toLowerCase())
    );
    
    searchResults.innerHTML = '';
    
    if (demoData.length === 0) {
        searchResults.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No demo results found. Try searching for "vata", "pitta", or "anxiety"</p>';
        return;
    }
    
    demoData.forEach(concept => {
        const conceptCard = document.createElement('div');
        conceptCard.className = 'concept-card';
        conceptCard.innerHTML = `
            <div class="concept-header">
                <span class="concept-code">${concept.code}</span>
                <span class="concept-system">${getSystemName(concept.system)}</span>
            </div>
            <div class="concept-display">${concept.display}</div>
            <div class="concept-definition">${concept.definition}</div>
        `;
        
        conceptCard.addEventListener('click', () => selectConcept({
            code: concept.code,
            display: concept.display,
            system: concept.system
        }));
        
        searchResults.appendChild(conceptCard);
    });
}

// Display search results from API
function displaySearchResults(data) {
    searchResults.innerHTML = '';
    
    // Handle FHIR Parameters response structure
    let concepts = [];
    
    if (data.resourceType === 'Parameters' && data.parameter) {
        const resultParam = data.parameter.find(p => p.name === 'result');
        if (resultParam && resultParam.part) {
            const conceptsParam = resultParam.part.find(p => p.name === 'concepts');
            if (conceptsParam && conceptsParam.resource && conceptsParam.resource.entry) {
                concepts = conceptsParam.resource.entry.map(entry => {
                    const coding = entry.resource.code.coding[0];
                    return {
                        code: coding.code,
                        display: coding.display,
                        system: coding.system,
                        definition: entry.resource.text ? entry.resource.text.div : coding.display
                    };
                });
            }
        }
    }
    
    if (concepts.length === 0) {
        searchResults.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No results found. Try different search terms.</p>';
        return;
    }
    
    concepts.forEach(concept => {
        const conceptCard = document.createElement('div');
        conceptCard.className = 'concept-card';
        conceptCard.innerHTML = `
            <div class="concept-header">
                <span class="concept-code">${concept.code}</span>
                <span class="concept-system">${getSystemName(concept.system)}</span>
            </div>
            <div class="concept-display">${concept.display}</div>
            <div class="concept-definition">${concept.definition}</div>
        `;
        
        conceptCard.addEventListener('click', () => selectConcept({
            code: concept.code,
            display: concept.display,
            system: concept.system
        }));
        
        searchResults.appendChild(conceptCard);
    });
}

// Rest of your functions remain the same...
function selectConcept(coding) {
    const existing = selectedConcepts.find(c => c.code === coding.code && c.system === coding.system);
    if (existing) return;
    
    selectedConcepts.push(coding);
    updateSelectedConcepts();
}

function updateSelectedConcepts() {
    if (selectedConcepts.length === 0) {
        selectedConceptsContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No concepts selected. Click on search results to select concepts.</p>';
        return;
    }
    
    selectedConceptsContainer.innerHTML = selectedConcepts.map((concept, index) => `
        <div class="selected-concept" style="background: #e6fffa; border: 1px solid #38b2ac; border-radius: 6px; padding: 15px; margin-bottom: 15px; position: relative;">
            <button class="remove-concept" onclick="removeConcept(${index})" style="position: absolute; top: 10px; right: 10px; background: #e53e3e; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">×</button>
            <div class="concept-header" style="margin-bottom: 8px;">
                <span class="concept-code" style="background: #667eea; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; margin-right: 8px;">${concept.code}</span>
                <span class="concept-system" style="background: #48bb78; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${getSystemName(concept.system)}</span>
            </div>
            <div class="concept-display" style="font-weight: bold; margin-bottom: 5px;">${concept.display}</div>
            <div class="mapping-info" style="margin-top: 10px; padding: 10px; background: #fff5f5; border-radius: 4px; border-left: 4px solid #38b2ac;">
                <em>Demo: Auto-translation to ICD-11 available</em>
            </div>
        </div>
    `).join('');
}

function removeConcept(index) {
    selectedConcepts.splice(index, 1);
    updateSelectedConcepts();
}

async function generateBundle() {
    if (selectedConcepts.length === 0) {
        showError('Please select at least one concept');
        return;
    }
    
    const patientId = patientIdInput.value.trim() || 'patient-demo-001';
    
    // Demo FHIR Bundle
    const demoBundle = {
        resourceType: 'Bundle',
        id: 'demo-bundle-' + Date.now(),
        meta: {
            lastUpdated: new Date().toISOString()
        },
        type: 'collection',
        total: selectedConcepts.length,
        entry: selectedConcepts.map((concept, index) => ({
            resource: {
                resourceType: 'Condition',
                id: 'condition-' + index,
                meta: {
                    lastUpdated: new Date().toISOString()
                },
                clinicalStatus: {
                    coding: [{
                        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                        code: 'active',
                        display: 'Active'
                    }]
                },
                code: {
                    coding: [{
                        system: concept.system,
                        code: concept.code,
                        display: concept.display
                    }],
                    text: concept.display
                },
                subject: {
                    reference: `Patient/${patientId}`
                },
                recordedDate: new Date().toISOString()
            }
        }))
    };
    
    fhirBundleContainer.textContent = JSON.stringify(demoBundle, null, 2);
    showSuccess('Demo FHIR Bundle generated successfully!');
}

// Utility functions
function getSystemName(systemUri) {
    if (systemUri.includes('ayurveda')) return 'Ayurveda';
    if (systemUri.includes('siddha')) return 'Siddha'; 
    if (systemUri.includes('unani')) return 'Unani';
    if (systemUri.includes('icd')) return 'ICD-11';
    return 'Unknown';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #fed7d7; color: #c53030; padding: 15px; border-radius: 6px; border-left: 4px solid #e53e3e; z-index: 1000; max-width: 300px;';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #c6f6d5; color: #2f855a; padding: 15px; border-radius: 6px; border-left: 4px solid #38a169; z-index: 1000; max-width: 300px;';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 5000);
}

function runDemoScenario(scenario) {
    selectedConcepts = [];
    updateSelectedConcepts();
    
    switch (scenario) {
        case 'anxiety':
            searchInput.value = 'vata';
            break;
        case 'diabetes':  
            searchInput.value = 'pitta';
            break;
        case 'fatigue':
            searchInput.value = 'kapha';
            break;
    }
    
    performSearch();
}
