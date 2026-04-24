const fetch = require('node:fetch');
const aiConfig = require('../config/aiConfig');

class AIService {
    constructor() {
        this.inferenceUrl = aiConfig.modalInferenceUrl;
    }

    async analyzeImage(imageBuffer) {
        if (!this.inferenceUrl) {
            throw new Error('Modal Inference URL is not properly configured.');
        }

        const response = await fetch(this.inferenceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
            body: imageBuffer
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Cloud AI Error: ${errorBody}`);
        }

        return await response.json();
    }
}

module.exports = AIService;
