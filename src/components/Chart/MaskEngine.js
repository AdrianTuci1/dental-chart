/**
 * MaskEngine Utility
 * Handles applying image-based masks to canvas contexts.
 * Clips condition overlays to only appear within the tooth image boundaries.
 */
import { drawToothSurface, getToothType } from '../../utils/svgPaths';

class MaskEngine {
    constructor() {
        this.imageCache = new Map();
        this.pendingLoads = new Map();
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

    /**
     * Draws conditions masked by an image onto the canvas.
     * The conditions will only be visible within the non-transparent areas of the mask image.
     * 
     * @param {CanvasRenderingContext2D} ctx - The canvas context (ALREADY SCALED)
     * @param {string} imagePath - Path to the mask image (PNG with transparency)
     * @param {Array<{toothNumber: string, view: string, surface: string, color: string, opacity: number, stroke: string, strokeWidth: number}>} conditions - Array of conditions to draw
     * @param {number} logicalWidth - Logical canvas width (100)
     * @param {number} logicalHeight - Logical canvas height (150 or 100)
     */
    async drawMaskedConditions(ctx, imagePath, conditions, logicalWidth, logicalHeight) {
        if (!ctx || !conditions.length) return;

        try {
            let maskImage = null;
            if (imagePath) {
                try {
                    maskImage = await this.loadImage(imagePath);
                } catch (e) {
                    console.warn(`MaskEngine: Failed to load mask image ${imagePath}`, e);
                }
            }

            // Determine SCALE FACTOR (High DPI support)
            // Use backingStore width vs logical width
            // If main canvas uses scale(2, 2), we want to draw at 2x resolution offscreen
            const backingWidth = ctx.canvas.width;
            const scale = backingWidth / logicalWidth; // e.g., 200 / 100 = 2

            // Clear the main canvas (logical coords)
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);

            // Create an offscreen canvas at PHYSICAL resolution
            const offScreenCanvas = document.createElement('canvas');
            offScreenCanvas.width = logicalWidth * scale;
            offScreenCanvas.height = logicalHeight * scale;
            const offCtx = offScreenCanvas.getContext('2d');

            // Apply scale to offscreen context so we can use logical coords for drawing
            offCtx.scale(scale, scale);

            // Step 1: Draw all conditions onto offscreen canvas
            offCtx.globalCompositeOperation = 'source-over';
            conditions.forEach(cond => {
                offCtx.fillStyle = cond.color || 'rgba(100, 150, 255, 0.7)';
                offCtx.globalAlpha = cond.opacity || 0.7;

                // Draw the surface path (uses logical coords)
                drawToothSurface(offCtx, cond.toothNumber, cond.view, cond.surface, logicalWidth, logicalHeight);
                offCtx.fill();

                if (cond.stroke && cond.stroke !== 'none') {
                    offCtx.strokeStyle = cond.stroke;
                    offCtx.lineWidth = cond.strokeWidth || 1;
                    offCtx.stroke();
                }
            });

            // Reset alpha
            offCtx.globalAlpha = 1.0;

            // Step 2: Apply the mask using destination-in
            if (maskImage) {
                offCtx.globalCompositeOperation = 'destination-in';

                // Scale filter: Softened threshold for smoother edges
                offCtx.filter = 'url(#dchart-hard-alpha)';

                // Draw mask image filling the space
                // Since context is scaled, drawing at (0,0,logicalW,logicalH) fills the high-res canvas
                offCtx.drawImage(maskImage, 0, 0, logicalWidth, logicalHeight);

                offCtx.filter = 'none'; // Reset filter
                offCtx.globalCompositeOperation = 'source-over';
            }

            // Step 3: Draw the composited result onto the main canvas
            // Use drawImage with source and dest coords to ensure proper mapping
            // Note: offScreenCanvas is large (200x300), ctx is scaled (2x).
            // We want to draw the whole offCanvas into 0,0,width,height of ctx
            ctx.globalCompositeOperation = 'source-over';

            // Reset transform temporarily to draw pixel-to-pixel?
            // Or just draw scaled image?
            // Since ctx is scaled by 'scale', drawing at 0,0,width,height means:
            // dest pixel width = width * scale = 200.
            // visual size = logical size.
            // Works correctly.

            ctx.drawImage(offScreenCanvas, 0, 0, logicalWidth, logicalHeight);

        } catch (error) {
            console.error("MaskEngine Error:", error);
        }
    }
}

export const maskEngine = new MaskEngine();
