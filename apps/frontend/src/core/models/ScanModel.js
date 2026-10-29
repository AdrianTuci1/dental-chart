/**
 * Domain-Driven Design Model for Pan / Zoom / Rotate interactions.
 * Encapsulates calculation logic for image manipulation.
 */
export class ScanModel {
    static INITIAL_TRANSFORM = {
        x: 0,
        y: 0,
        rotate: 0,
        scale: 0.9
    };

    static ZOOM_STEP = 0.05;
    static ROTATE_STEP = 5;

    /**
     * Calculate new pan position.
     */
    static calculatePan(dragState, currentX, currentY) {
        const dx = currentX - dragState.startX;
        const dy = currentY - dragState.startY;
        
        return {
            x: dragState.initialX + dx,
            y: dragState.initialY + dy
        };
    }

    /**
     * Calculate new zoom scale.
     */
    static calculateZoom(currentScale, deltaY) {
        const factor = deltaY > 0 ? (1 - this.ZOOM_STEP) : (1 + this.ZOOM_STEP);
        const newScale = currentScale * factor;
        return Math.min(Math.max(newScale, 0.1), 5);
    }

    /**
     * Calculate new rotation angle.
     */
    static calculateRotate(currentRotate, direction) {
        const delta = direction === 'cw' ? this.ROTATE_STEP : -this.ROTATE_STEP;
        return currentRotate + delta;
    }

    /**
     * Calculate distance between two touch points (for pinch zoom).
     */
    static getTouchDistance(touches) {
        if (touches.length < 2) return 0;
        return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
    }
}
