const apiKey = process.env.GEMINI_API_KEY;

// Check if API Key is available
if (!apiKey) {
    console.log('⚠️ Warning: GEMINI_API_KEY is not defined in environment variables. Scorer will fallback to offline local scoring.');
}

/**
 * Gemini API Client.
 * (Prompt design and API requests will be implemented in Tasks 17-18)
 */
async function callGeminiAPI(category, comment) {
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is missing');
    }
    
    // Stub to be implemented in Task 18
    return {
        category,
        riskScore: 5,
        explanation: 'AI Audit placeholder',
        fixSuggestion: 'Code fix placeholder'
    };
}

module.exports = { callGeminiAPI };
