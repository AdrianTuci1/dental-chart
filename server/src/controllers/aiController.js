const AIService = require('../services/AIService');
const aiService = new AIService();

const path = require('path');
const fs = require('fs');

exports.analyzeXray = async (req, res) => {
    // 1. Dacă serviciul este dezactivat, returnăm fallback-ul (MOCK)
    if (process.env.AI_ANALYSIS_ENABLED !== 'true') {
        return serveFallback(res, 'AI Analysis is currently in MOCK mode.');
    }

    try {
        const result = await aiService.analyzeImage(req.body);
        res.json(result);
    } catch (error) {
        console.error('[AI Controller] Error:', error.message);
        // 2. În caz de eroare (service inactive/timeout), dăm fallback ca să nu crape UI-ul
        return serveFallback(res, 'AI Service error, falling back to mock data.');
    }
};

/**
 * Helper pentru a servi datele de test salvate local
 */
function serveFallback(res, reason) {
    const fallbackPath = path.join(__dirname, '../../public/detections.json');
    try {
        const data = fs.readFileSync(fallbackPath, 'utf8');
        const json = JSON.parse(data);
        return res.json({
            ...json,
            mock_image_url: '/api/ai/assets/chart2.png',
            meta: {
                fallback: true,
                reason: reason,
                timestamp: new Date().toISOString()
            }
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to load fallback detections' });
    }
}

/**
 * Servește asset-uri specifice modulului AI (imagini de test, măști, etc.)
 * Gated by AI_ANALYSIS_ENABLED
 */
exports.serveAsset = (req, res) => {
    const relativePath = req.params[0]; 
    const publicDir = path.resolve(__dirname, '../../public');
    const safePath = path.resolve(publicDir, relativePath);

    // Securitate împotriva Path Traversal
    if (!safePath.startsWith(publicDir)) {
        return res.status(403).json({ error: 'Acces interzis' });
    }

    res.sendFile(safePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Asset-ul nu a fost găsit' });
        }
    });
};
