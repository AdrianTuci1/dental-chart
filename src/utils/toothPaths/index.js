import { getToothType } from './constants';
import { drawAnteriorTop, drawAnteriorFrontal } from './anterior';
import { drawPremolarTop, drawPremolarFrontal } from './premolar';
import { drawMolarTop, drawMolarFrontal } from './molar';

export { getToothType };

/**
 * Main dispatcher for drawing tooth surfaces.
 * Selects the correct drawing function based on tooth type and view.
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string|number} toothNumber - Tooth number (ISO)
 * @param {string} view - View type ('topview', 'frontal', 'lingual', 'occlusal', etc.)
 * @param {string} surface - Surface to draw ('mesial', 'distal', 'occlusal', etc.)
 */
export const drawToothSurface = (ctx, toothNumber, view, surface, w, h) => {
    // 1. Determine dimensions from args if available, otherwise from canvas
    // Explicit args are critical when context is scaled (High-DPI) but backing store is large
    const width = w !== undefined ? w : (ctx.canvas ? ctx.canvas.width : 100);
    const height = h !== undefined ? h : (ctx.canvas ? ctx.canvas.height : 100);

    // 2. Determine tooth category
    const type = getToothType(toothNumber);

    // 3. Normalize view to Top vs Frontal
    // 'topview', 'occlusal', 'incisal' -> Top
    // 'frontal', 'buccal', 'lingual', 'outside', 'inside' -> Frontal
    const isTop = ['topview', 'occlusal', 'incisal', 'top'].includes(view.toLowerCase());

    // 4. Dispatch
    if (type === 'anterior') {
        if (isTop) drawAnteriorTop(ctx, surface, width, height);
        else drawAnteriorFrontal(ctx, surface, width, height);
    }
    else if (type === 'premolar') {
        if (isTop) drawPremolarTop(ctx, surface, width, height);
        else drawPremolarFrontal(ctx, surface, width, height);
    }
    else { // molar
        if (isTop) drawMolarTop(ctx, surface, width, height);
        else drawMolarFrontal(ctx, surface, width, height);
    }
};
