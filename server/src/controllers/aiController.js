const AIService = require('../services/AIService');
const aiService = new AIService();

exports.analyzeXray = async (req, res) => {
    try {
        // req.body conține imaginea (bytes) datorită express.raw() din rute
        const result = await aiService.analyzeImage(req.body);
        res.json(result);
    } catch (error) {
        console.error('[AI Controller] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};
