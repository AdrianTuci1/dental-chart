const fs = require('fs');
const path = require('path');

const CONTENT_TYPES = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
};

/**
 * Where the built static assets sit in the single-artifact package: dist/ next to
 * server/, which is also how the repository is laid out after a build. app.js passes
 * the root it derives from STATIC_DIR, so this default only covers direct callers.
 */
const defaultRoot = path.join(__dirname, '../../../dist/static');

/**
 * Reads AI assets from the built static directory — the same tree the browser requests
 * under /static/ and the same one the Worker reads through its assets binding. The
 * server used to keep a second copy under server/public, which quietly drifted from the
 * detections file the Modal pipeline writes.
 *
 * Path traversal stays impossible because the resolved path is checked against the
 * configured root.
 */
const createNodeAssetProvider = (root = defaultRoot) => {
    const resolvedRoot = path.resolve(root);

    return async (relativePath) => {
        const safePath = path.resolve(resolvedRoot, String(relativePath || ''));

        if (safePath !== resolvedRoot && !safePath.startsWith(resolvedRoot + path.sep)) {
            throw new Error('Asset path escapes the public directory');
        }

        const body = await fs.promises.readFile(safePath);
        const contentType = CONTENT_TYPES[path.extname(safePath).toLowerCase()] || 'application/octet-stream';

        return { body, contentType };
    };
};

module.exports = { createNodeAssetProvider, CONTENT_TYPES };
