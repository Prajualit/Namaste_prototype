/**
 * Simple AI Features Test - Direct DOM manipulation
 */

console.log('🚀 Simple AI features loading...');

function createSimpleAIPanel() {
    console.log('🔧 Creating simple AI panel...');
    
    // Remove any existing panel
    const existingPanel = document.querySelector('#simple-ai-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // Create the AI panel
    const aiPanel = document.createElement('div');
    aiPanel.id = 'simple-ai-panel';
    aiPanel.style.cssText = `
        margin: 20px 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 20px;
        color: white;
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    `;
    
    aiPanel.innerHTML = `
        <h3 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-brain"></i> AI-Powered Features (Test)
        </h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 15px;">
            <button id="test-ai-mapping" style="padding: 12px 20px; border: none; border-radius: 8px; background: #4CAF50; color: white; cursor: pointer;">
                <i class="fas fa-map-marked-alt"></i> Test Smart Mapping
            </button>
            <button id="test-ai-translation" style="padding: 12px 20px; border: none; border-radius: 8px; background: #2196F3; color: white; cursor: pointer;">
                <i class="fas fa-language"></i> Test AI Translation
            </button>
            <button id="test-ai-analysis" style="padding: 12px 20px; border: none; border-radius: 8px; background: #FF9800; color: white; cursor: pointer;">
                <i class="fas fa-stethoscope"></i> Test Symptom Analysis
            </button>
        </div>
        <div style="text-align: center;">
            <span style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px;">
                <i class="fas fa-circle" style="color: #4CAF50;"></i> AI Ready
            </span>
        </div>
        <div id="ai-test-results" style="margin-top: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; min-height: 50px;">
            <em>Click any button above to test AI features...</em>
        </div>
    `;
    
    // Add event listeners after creating the HTML
    setTimeout(() => {
        const mappingBtn = document.getElementById('test-ai-mapping');
        const translationBtn = document.getElementById('test-ai-translation');
        const analysisBtn = document.getElementById('test-ai-analysis');
        
        if (mappingBtn) {
            mappingBtn.addEventListener('click', testAIMapping);
            console.log('✅ Added mapping button listener');
        }
        if (translationBtn) {
            translationBtn.addEventListener('click', testAITranslation);
            console.log('✅ Added translation button listener');
        }
        if (analysisBtn) {
            analysisBtn.addEventListener('click', testAIAnalysis);
            console.log('✅ Added analysis button listener');
        }
    }, 100);
    
    // Find where to insert it
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        console.log('✅ Found search container, inserting AI panel after it');
        searchContainer.parentNode.insertBefore(aiPanel, searchContainer.nextSibling);
        return true;
    }
    
    const demoSection = document.querySelector('.demo-section');
    if (demoSection) {
        console.log('✅ Found demo section, inserting AI panel at beginning');
        demoSection.insertBefore(aiPanel, demoSection.firstChild);
        return true;
    }
    
    const dashboardSection = document.querySelector('#dashboardSection');
    if (dashboardSection) {
        console.log('✅ Found dashboard section, inserting AI panel');
        dashboardSection.appendChild(aiPanel);
        return true;
    }
    
    console.error('❌ Could not find any suitable container for AI panel');
    return false;
}

// Test functions for AI features
async function testAIMapping() {
    const resultsDiv = document.getElementById('ai-test-results');
    resultsDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing AI Mapping...';
    
    try {
        const response = await fetch('/api/terminology/map', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken || 'demo-token'}`
            },
            body: JSON.stringify({
                concept: "headache",
                sourceSystem: "ayurveda",
                targetSystem: "icd11",
                confidence: 0.3
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            resultsDiv.innerHTML = `
                <div style="background: #4CAF50; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                    ✅ <strong>AI Mapping Successful!</strong>
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; font-size: 0.9rem;">
                    <strong>Result:</strong> ${data.name || 'Concept mapping generated'}<br>
                    <strong>Status:</strong> ${data.status}<br>
                    <strong>Mapped Elements:</strong> ${data.group?.[0]?.element?.length || 0}
                </div>
            `;
        } else {
            throw new Error(data.message || 'Mapping failed');
        }
    } catch (error) {
        resultsDiv.innerHTML = `
            <div style="background: #f44336; padding: 10px; border-radius: 5px;">
                ❌ <strong>AI Mapping Error:</strong><br>
                ${error.message}
            </div>
        `;
    }
};

async function testAITranslation() {
    const resultsDiv = document.getElementById('ai-test-results');
    resultsDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing AI Translation...';
    
    try {
        const response = await fetch('/api/terminology/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken || 'demo-token'}`
            },
            body: JSON.stringify({
                concept: "Vata dosha",
                sourceLanguage: "en",
                targetLanguage: "hi",
                system: "ayurveda"
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            resultsDiv.innerHTML = `
                <div style="background: #2196F3; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                    ✅ <strong>AI Translation Successful!</strong>
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; font-size: 0.9rem;">
                    <strong>Original:</strong> Vata dosha<br>
                    <strong>Translated:</strong> ${data.translatedTerm || 'Translation generated'}<br>
                    <strong>Confidence:</strong> ${Math.round((data.confidence || 0.5) * 100)}%<br>
                    <strong>Context:</strong> ${data.culturalContext || 'AI-generated translation'}
                </div>
            `;
        } else {
            throw new Error(data.message || 'Translation failed');
        }
    } catch (error) {
        resultsDiv.innerHTML = `
            <div style="background: #f44336; padding: 10px; border-radius: 5px;">
                ❌ <strong>AI Translation Error:</strong><br>
                ${error.message}
            </div>
        `;
    }
};

async function testAIAnalysis() {
    const resultsDiv = document.getElementById('ai-test-results');
    resultsDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing AI Symptom Analysis...';
    
    try {
        const response = await fetch('/api/terminology/analyze-symptoms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken || 'demo-token'}`
            },
            body: JSON.stringify({
                symptoms: ["headache", "fatigue", "anxiety"],
                language: "en",
                system: "ayurveda"
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            resultsDiv.innerHTML = `
                <div style="background: #FF9800; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                    ✅ <strong>AI Analysis Successful!</strong>
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; font-size: 0.9rem;">
                    <strong>Conditions Found:</strong> ${data.suggestedConditions?.length || 0}<br>
                    <strong>First Condition:</strong> ${data.suggestedConditions?.[0]?.display || 'AI analysis complete'}<br>
                    <strong>Recommendations:</strong> ${data.recommendations ? 'Available' : 'Generated'}<br>
                    <em style="color: #FFC107;">⚠️ AI analysis for informational purposes only</em>
                </div>
            `;
        } else {
            throw new Error(data.message || 'Analysis failed');
        }
    } catch (error) {
        resultsDiv.innerHTML = `
            <div style="background: #f44336; padding: 10px; border-radius: 5px;">
                ❌ <strong>AI Analysis Error:</strong><br>
                ${error.message}
            </div>
        `;
    }
};

// Initialize when DOM is ready and dashboard is visible
function initSimpleAI() {
    const dashboardSection = document.getElementById('dashboardSection');
    if (dashboardSection && dashboardSection.style.display !== 'none') {
        console.log('🎯 Dashboard visible, creating simple AI panel...');
        const success = createSimpleAIPanel();
        if (success) {
            console.log('✅ Simple AI panel created successfully!');
        }
        return true;
    }
    return false;
}

// Try immediate initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Simple AI script loaded');
    
    if (!initSimpleAI()) {
        // Check periodically for dashboard
        const checkInterval = setInterval(() => {
            if (initSimpleAI()) {
                clearInterval(checkInterval);
            }
        }, 500);
        
        // Stop after 30 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            console.log('⏰ Stopped checking for dashboard after 30 seconds');
        }, 30000);
    }
});

// Expose function to manually trigger
window.createSimpleAIPanel = createSimpleAIPanel;

console.log('✅ Simple AI features script ready');