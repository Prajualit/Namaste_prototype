// Debug AI Features
console.log('🔍 Debug AI script loaded');

// Test if AI features are working
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Debug: DOM ready');
    
    setTimeout(() => {
        console.log('🔍 Debug: Checking for AI panel...');
        const aiPanel = document.querySelector('#ai-features-panel');
        console.log('🔍 AI Panel found:', !!aiPanel);
        
        if (aiPanel) {
            console.log('🔍 AI Panel HTML:', aiPanel.innerHTML);
        }
        
        const aiButtons = document.querySelectorAll('.ai-feature-btn');
        console.log('🔍 AI Buttons found:', aiButtons.length);
        
        aiButtons.forEach((btn, index) => {
            console.log(`🔍 Button ${index}:`, btn.id, btn.onclick);
        });
        
        // Check if window.initializeAIFeatures exists
        console.log('🔍 window.initializeAIFeatures:', typeof window.initializeAIFeatures);
        
        // Try to initialize manually
        if (typeof window.initializeAIFeatures === 'function') {
            console.log('🔍 Calling initializeAIFeatures manually...');
            window.initializeAIFeatures();
        }
    }, 2000);
});