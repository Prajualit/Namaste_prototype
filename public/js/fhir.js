// FHIR Bundle display utilities
function formatFHIRBundle(bundle) {
    return JSON.stringify(bundle, null, 2);
}

function highlightFHIRCode(jsonText) {
    // Simple syntax highlighting for JSON
    return jsonText
        .replace(/(".*?")/g, '<span style="color: #22c55e;">$1</span>')
        .replace(/(\d+)/g, '<span style="color: #3b82f6;">$1</span>')
        .replace(/(true|false|null)/g, '<span style="color: #ef4444;">$1</span>');
}
