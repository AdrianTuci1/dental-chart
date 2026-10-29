const aiConfig = require('../config');
const AssetService = require('./AssetService');
const {
    NotFoundError,
    ServiceUnavailableError,
} = require('../../../shared/errors/AppError');

// The fallback detections are an asset like any other AI asset, so they come through the
// same provider and there is one runtime source for them.
const FALLBACK_DETECTIONS = 'detections.json';

/**
 * X-ray analysis. The Modal endpoint is optional: a disabled module or an unreachable
 * endpoint answers with the packaged detections so the UI keeps working, and the caller
 * is told which path produced the answer.
 */
class AIService {
    constructor({
        inferenceUrl = aiConfig.modalInferenceUrl,
        fetchImpl = (...args) => globalThis.fetch(...args),
        assetService = new AssetService(),
    } = {}) {
        this.inferenceUrl = inferenceUrl;
        this.fetchImpl = fetchImpl;
        this.assetService = assetService;
    }

    isEnabled() {
        return process.env.AI_ANALYSIS_ENABLED === 'true';
    }

    async analyzeImage(imageBuffer) {
        if (!this.inferenceUrl) {
            throw new Error('Modal Inference URL is not properly configured.');
        }

        if (typeof globalThis.fetch !== 'function') {
            throw new Error('Fetch API is not available in this Node runtime.');
        }

        const response = await this.fetchImpl(this.inferenceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
            },
            body: imageBuffer,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Cloud AI Error: ${errorBody}`);
        }

        return response.json();
    }

    /**
     * @returns {Promise<{ payload: object, usedFallback: boolean }>}
     */
    async analyzeWithFallback(imageBuffer) {
        if (!this.isEnabled()) {
            return this.fallback('AI Analysis is currently in MOCK mode.');
        }

        try {
            return { payload: await this.analyzeImage(imageBuffer), usedFallback: false };
        } catch (error) {
            console.error('[AIService] inference failed:', error.message);
            return this.fallback('AI Service error, falling back to mock data.');
        }
    }

    async fallback(reason) {
        let detections;

        try {
            detections = await this.assetService.loadJson(FALLBACK_DETECTIONS);
        } catch (error) {
            console.error('[AIService] fallback detections unavailable:', error.message);
            throw new ServiceUnavailableError('AI mock data is unavailable');
        }

        return {
            usedFallback: true,
            payload: {
                ...detections,
                mock_image_url: '/api/ai/assets/chart2.png',
                meta: {
                    fallback: true,
                    reason,
                    timestamp: new Date().toISOString(),
                },
            },
        };
    }

    async getAsset(relativePath) {
        try {
            return await this.assetService.load(relativePath);
        } catch {
            throw new NotFoundError('Asset-ul nu a fost găsit');
        }
    }
}

module.exports = AIService;
