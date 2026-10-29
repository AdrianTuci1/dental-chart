const { loadAsset } = require('../infrastructure/assetProvider');

/**
 * Reads the AI module's sample assets from whichever runtime provider was installed at
 * boot (filesystem on Node, assets binding on the Worker). The provider itself is
 * infrastructure, so the application only sees `load`.
 */
class AssetService {
    constructor({ loader = loadAsset } = {}) {
        this.loader = loader;
    }

    load(relativePath) {
        return this.loader(relativePath);
    }

    async loadJson(relativePath) {
        const asset = await this.load(relativePath);
        return JSON.parse(asset.body.toString('utf8'));
    }
}

module.exports = AssetService;
