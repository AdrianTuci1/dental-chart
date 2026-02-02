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
     * @param {CanvasRenderingContext2D} ctx - The canvas context (may be scaled)
     * @param {string} imagePath - Path to the mask image (PNG with transparency)
     * @param {Array<{toothNumber: string, view: string, surface: string, color: string, opacity: number, stroke: string, strokeWidth: number}>} conditions - Array of conditions to draw
     * @param {number} width - Logical canvas width (before scaling)
     * @param {number} height - Logical canvas height (before scaling)
     */
    async drawMaskedConditions(ctx, imagePath, conditions, width, height) {
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

            // Clear the main canvas (in logical coordinates, since ctx is already scaled)
            ctx.clearRect(0, 0, width, height);

            // Create an offscreen canvas for compositing
            // Use LOGICAL dimensions - the ctx is already scaled
            const offScreenCanvas = document.createElement('canvas');
            offScreenCanvas.width = width;
            offScreenCanvas.height = height;
            const offCtx = offScreenCanvas.getContext('2d');

            // Step 1: Draw all conditions onto offscreen canvas
            offCtx.globalCompositeOperation = 'source-over';
            conditions.forEach(cond => {
                offCtx.fillStyle = cond.color || 'rgba(100, 150, 255, 0.7)';
                offCtx.globalAlpha = cond.opacity || 0.7;

                // Draw the surface path
                drawToothSurface(offCtx, cond.toothNumber, cond.view, cond.surface);
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
            // This keeps the existing content (conditions) only where the mask image has non-zero alpha
            if (maskImage) {
                offCtx.globalCompositeOperation = 'destination-in';
                offCtx.drawImage(maskImage, 0, 0, width, height);
                offCtx.globalCompositeOperation = 'source-over';
            }

            // Step 3: Draw the composited result onto the main canvas
            // Note: The main ctx is already scaled, so we draw at logical size
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(offScreenCanvas, 0, 0, width, height);

        } catch (error) {
            console.error("MaskEngine Error:", error);
        }
    }
}

export const maskEngine = new MaskEngine();
