import { drawMolarTop, drawMolarFrontal } from './molar';

/**
 * Premolar logic currently mirrors Molar logic as requested.
 * This file serves as a placeholder for future specific Premolar anatomy.
 */

export const drawPremolarTop = (ctx, surface, w, h) => {
    drawMolarTop(ctx, surface, w, h);
};

export const drawPremolarFrontal = (ctx, surface, w, h) => {
    drawMolarFrontal(ctx, surface, w, h);
};
