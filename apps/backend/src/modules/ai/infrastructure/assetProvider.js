/**
 * The AI module serves its sample assets through this provider so the same
 * controller runs on both hosts: Node (Lambda or a local process) reads them from
 * disk, and a Cloudflare Worker reads them from the static assets binding. Neither
 * implementation is imported here, so the Worker bundle never pulls in `fs`.
 */
let provider = null;

const setAssetProvider = (nextProvider) => {
    provider = nextProvider;
};

const loadAsset = async (relativePath) => {
    if (!provider) {
        throw new Error('No asset provider configured for this runtime');
    }

    return provider(relativePath);
};

module.exports = {
    setAssetProvider,
    loadAsset,
};
