const { callGeminiAPI } = require('./gemini-client');
const { calculateRiskAndExplanationLocal } = require('./local-engine');

/**
 * Hybrid Audit Router.
 * Attempts to audit the comment using Google Gemini. On failure, gracefully
 * degrades to local heuristic scoring rules.
 */
async function auditComment(category, comment, commitDateString) {
    try {
        // Step A: Attempt live AI evaluation using Google Gemini
        const aiResult = await callGeminiAPI(category, comment);
        
        return {
            riskScore: aiResult.riskScore,
            aiCategory: aiResult.category, // Security, Performance, Maintenance, Feature
            explanation: aiResult.explanation,
            fixSuggestion: aiResult.fixSuggestion
        };
    } catch (error) {
        // Step B: Graceful Fallback to offline rule-based heuristics
        console.log(`ℹ️ AI audit skipped: falling back to local scoring rules (${error.message})`);
        
        const localResult = calculateRiskAndExplanationLocal(category, comment, commitDateString);
        
        return {
            riskScore: localResult.riskScore,
            aiCategory: category, // TODO, FIXME, HACK
            explanation: localResult.explanation,
            fixSuggestion: localResult.fixSuggestion
        };
    }
}

module.exports = { auditComment };
