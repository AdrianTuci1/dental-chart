/**
 * MaskEngine Utility
 * Handles applying image-based masks to canvas contexts.
 * Clips condition overlays to only appear within the tooth image boundaries.
 */

class MaskEngine {
    constructor() {
        this.imageCache = new Map();
        this.pendingLoads = new Map();
        // _injectSvgFilter removed/kept? User included it in paste. I'll keep it to match user intent.
        this._injectSvgFilter();
    }

    /**
     * Injects a hidden SVG filter into the DOM.
     * This filter is used to create a "hard" alpha mask by increasing contrast on the alpha channel.
     * This avoids CORS issues related to getImageData/pixel manipulation.
     */
    _injectSvgFilter() {
        if (typeof document === 'undefined' || document.getElementById('dchart-mask-filters')) return;

        const div = document.createElement('div');
        div.id = 'dchart-mask-filters';
        div.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
        div.innerHTML = `
            <svg width="0" height="0">
                <defs>
                    <filter id="dchart-hard-alpha">
                       <feComponentTransfer>
                           <!-- 
                               Linear Transfer Function: Alpha_out = Slope * Alpha_in + Intercept 
                               
                               Adjusted for smoother edges (Anti-aliasing friendly):
                               Target:
                               - Alpha 0.80 -> 0.0 (Transparent)
                               - Alpha 0.90 -> 1.0 (Opaque)
                               
                               Slope = 5
                               Intercept = -3.5
                               
                               Values between 0.70 and 0.90 will have semi-transparency, reducing pixelation.
                           -->
                           <feFuncA type="linear" slope="4" intercept="-3"/>
                       </feComponentTransfer>
                    </filter>
                </defs>
            </svg>
        `;
        document.body.appendChild(div);
    }

    /**
     * Loads an image and returns a promise that resolves with the image element.
     * Caches loaded images.
     * @param {string} src - Image URL
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(src) {
        if (!src) return Promise.reject("No source provided");

        if (this.imageCache.has(src)) {
            return Promise.resolve(this.imageCache.get(src));
        }

        if (this.pendingLoads.has(src)) {
            return this.pendingLoads.get(src);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                this.imageCache.set(src, img);
                this.pendingLoads.delete(src);
                resolve(img);
            };
            img.onerror = (e) => {
                this.pendingLoads.delete(src);
                reject(e);
            };
            img.src = src;
        });

        this.pendingLoads.set(src, promise);
        return promise;
    }
}

export const maskEngine = new MaskEngine();
