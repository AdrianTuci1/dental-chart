/**
 * Asset provider for the Worker runtime: the AI module asks for files by relative path
 * and receives them from the static assets binding, which is the same set of files the
 * browser downloads. There is no filesystem on workerd, so nothing here touches one.
 */
const ASSETS_ORIGIN = 'https://assets.internal';

const createAssetsProvider = (env) => async (relativePath) => {
    const relative = String(relativePath || '').replace(/^\/+/, '');

    if (relative.includes('..')) {
        throw new Error('Asset path escapes the static prefix');
    }

    const path = `/static/${relative}`;
    const response = await env.ASSETS.fetch(new Request(`${ASSETS_ORIGIN}${path}`));

    if (!response.ok) {
        throw new Error(`Asset not found: ${path}`);
    }

    return {
        body: Buffer.from(await response.arrayBuffer()),
        contentType: response.headers.get('content-type') || 'application/octet-stream',
    };
};

module.exports = { createAssetsProvider };
