/**
 * ToothImageCache
 * Global image cache for tooth base images to prevent re-downloads on re-renders.
 * Uses the same pattern as MaskEngine for consistency.
 */

class ToothImageCache {
    constructor() {
        this.cache = new Map();
        this.pending = new Map();
    }

    /**
     * Preload an image and cache it. Returns a promise that resolves when loaded.
     * @param {string} src - Image URL
     * @returns {Promise<HTMLImageElement>}
     */
    preload(src) {
        if (!src) return Promise.reject(new Error('No source provided'));

        if (this.cache.has(src)) {
            return Promise.resolve(this.cache.get(src));
        }

        if (this.pending.has(src)) {
            return this.pending.get(src);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(src, img);
                this.pending.delete(src);
                resolve(img);
            };
            img.onerror = (e) => {
                this.pending.delete(src);
                reject(e);
            };
            img.src = src;
        });

        this.pending.set(src, promise);
        return promise;
    }

    /**
     * Get a cached image if available, null otherwise.
     * @param {string} src
     * @returns {HTMLImageElement|null}
     */
    get(src) {
        return this.cache.get(src) || null;
    }

    /**
     * Check if an image is cached or loading.
     * @param {string} src
     * @returns {boolean}
     */
    has(src) {
        return this.cache.has(src) || this.pending.has(src);
    }

    /**
     * Preload a batch of images in parallel.
     * @param {string[]} sources
     * @returns {Promise<HTMLImageElement[]>}
     */
    preloadBatch(sources) {
        return Promise.all(sources.map((src) => this.preload(src).catch(() => null)));
    }

    /**
     * Clear the entire cache.
     */
    clear() {
        this.cache.clear();
        this.pending.clear();
    }
}

export const toothImageCache = new ToothImageCache();
