const AIService = require('../services/AIService');
const UserAnalyticsService = require('../services/UserAnalyticsService');
const { loadAsset } = require('../services/assetProvider');
const { extractMedicIdFromRequest } = require('../utils/auth');

const aiService = new AIService();
const analyticsService = new UserAnalyticsService();

// The fallback detections are an asset like any other AI asset, so they come through the
// same provider and there is one runtime source for them. They used to be bundled from
// server/public, a copy the Modal pipeline never wrote to, which left the API answering
// with a frozen result set.
const FALLBACK_DETECTIONS = 'detections.json';

const loadFallbackDetections = async () => {
    const asset = await loadAsset(FALLBACK_DETECTIONS);

    return JSON.parse(asset.body.toString('utf8'));
};

exports.analyzeXray = async (req, res) => {
    // 1. Dacă serviciul este dezactivat, returnăm fallback-ul (MOCK)
    if (process.env.AI_ANALYSIS_ENABLED !== 'true') {
        return await serveFallback(res, 'AI Analysis is currently in MOCK mode.');
    }

    try {
        const result = await aiService.analyzeImage(req.body);
        
        // Track AI usage
        const userId = extractMedicIdFromRequest(req);
        if (userId) {
            void analyticsService.trackFeatureUsage(userId, 'ai_analysis');
        }

        res.json(result);
    } catch (error) {
        console.error('[AI Controller] Error:', error.message);
        // 2. În caz de eroare (service inactive/timeout), dăm fallback ca să nu crape UI-ul
        return await serveFallback(res, 'AI Service error, falling back to mock data.');
    }
};

/**
 * Helper pentru a servi datele de test salvate local
 */
async function serveFallback(res, reason) {
    let detections;

    try {
        detections = await loadFallbackDetections();
    } catch (error) {
        console.error('[AI Controller] Fallback detections unavailable:', error.message);

        return res.status(503).json({ error: 'AI mock data is unavailable' });
    }

    return res.json({
        ...detections,
        mock_image_url: '/api/ai/assets/chart2.png',
        meta: {
            fallback: true,
            reason: reason,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Servește asset-uri specifice modulului AI (imagini de test, măști, etc.)
 * Gated by AI_ANALYSIS_ENABLED
 */
exports.serveAsset = async (req, res) => {
    const relativePath = req.params[0];

    try {
        const asset = await loadAsset(relativePath);
        res.setHeader('Content-Type', asset.contentType);
        return res.send(asset.body);
    } catch {
        return res.status(404).json({ error: 'Asset-ul nu a fost găsit' });
    }
};
