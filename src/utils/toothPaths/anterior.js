import { traceRoundedRect, traceCircle, DIMS } from './constants';

/**
 * MASK CONFIGURATION
 * Adjust these values to fine-tune alignment
 */
const SCALE = 0.96;
const OFFSET_X = 0; // + moves right, - moves left
const OFFSET_Y = 0; // + moves down, - moves up

/**
 * Draws Anterior (Incisor/Canine) tooth surfaces
 */

export const drawAnteriorTop = (ctx, surface, width, height) => {
    ctx.save();
    // Apply centering + manual offset + scaling
    ctx.translate((width * (1 - SCALE) / 2) + OFFSET_X, (height * (1 - SCALE) / 2) + OFFSET_Y);
    ctx.scale(SCALE, SCALE);

    const sx = width / DIMS.TOP_W;
    const sy = height / DIMS.TOP_H;

    ctx.beginPath();

    switch (surface) {
        case 'buccal':
        case 'palatal':
        case 'surface': // General surface mapping
            // Orange Body from SVG
            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            ctx.lineTo(width, 47 * sy);
            ctx.bezierCurveTo(width, 47 * sy, 38.78 * sx, 37.65 * sy, 27.5 * sx, 37.5 * sy);
            ctx.bezierCurveTo(15.86 * sx, 37.35 * sy, 0, 47 * sy, 0, 47 * sy);
            ctx.lineTo(0, 0);
            break;

        case 'mid_mesial': // Class 4 Mesial (Blue Ellipse)
        case 'class4_mesial':
            {
                const cx = 6 * sx;
                const cy = 46.5 * sy;
                const rx = 15 * sx;
                const ry = 9.5 * sy;
                ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            }
            break;

        case 'mid_distal': // Class 4 Distal (Blue Ellipse)
        case 'class4_distal':
            {
                const cx = 51 * sx;
                const cy = 46.5 * sy;
                const rx = 15 * sx;
                const ry = 9.5 * sy;
                ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            }
            break;

        case 'incisal':
        case 'occlusal': // Map occlusal to incisal edge for anterior
            // Green band at bottom
            ctx.rect(0, 37 * sy, width, 19 * sy);
            break;

        case 'mesial':
            // Just a left strip for mesial if "point" is not applicable in top view well
            traceRoundedRect(ctx, 0, 20 * sy, 14 * sx, 60 * sy, 4 * sx);
            break;

        case 'distal':
            // Right strip
            traceRoundedRect(ctx, 38 * sx, 20 * sy, 14 * sx, 60 * sy, 4 * sx);
            break;
    }

    ctx.closePath();
    ctx.restore();
};

export const drawAnteriorFrontal = (ctx, surface, width, height) => {
    ctx.save();
    // Apply centering + manual offset + scaling
    ctx.translate((width * (1 - SCALE) / 2) + OFFSET_X, (height * (1 - SCALE) / 2) + OFFSET_Y);
    ctx.scale(SCALE, SCALE);

    // Determine bounds based on actual canvas size vs reference
    // Reference: 54x172
    const sx = width / DIMS.FRONT_W;
    const sy = height / DIMS.FRONT_H;

    ctx.beginPath();

    switch (surface) {
        case 'buccal':
        case 'palatal':
        case 'surface':
            // Orange Body (curved bottom)
            ctx.moveTo(width, height);
            ctx.lineTo(0, height);
            ctx.lineTo(0, 106 * sy);
            ctx.bezierCurveTo(0, 106 * sy, 16.22 * sx, 87.79 * sy, 27.5 * sx, 88 * sy);
            ctx.bezierCurveTo(39.14 * sx, 88.22 * sy, width, 106 * sy, width, 106 * sy);
            ctx.lineTo(width, height);
            break;

        case 'mid_mesial': // Class 4 Mesial
        case 'class4_mesial':
            {
                ctx.save();
                ctx.translate(5.881 * sx, 147.201 * sy);
                ctx.rotate(-10.39 * Math.PI / 180);
                ctx.ellipse(0, 0, 18 * sx, 29.5 * sy, 0, 0, Math.PI * 2);
                ctx.restore();
            }
            break;

        case 'mid_distal': // Class 4 Distal
        case 'class4_distal':
            {
                ctx.save();
                ctx.translate(46.655 * sx, 148.031 * sy);
                ctx.rotate(8.77 * Math.PI / 180);
                ctx.ellipse(0, 0, 16.84 * sx, 29.5 * sy, 0, 0, Math.PI * 2);
                ctx.restore();
            }
            break;

        case 'incisal':
        case 'occlusal':
            // Green band at absolute bottom
            ctx.rect(0, height - (13 * sy), width, 13 * sy);
            break;

        case 'mesial':
            // Red Point (Mesial Point)
            traceCircle(ctx, 0, 142 * sy, 11 * sx);
            break;

        case 'distal':
            // Red Point (Distal Point)
            traceCircle(ctx, 53.5 * sx, 141.5 * sy, 11.5 * sx);
            break;

        case 'cervical':
        case 'cervical buccal':
        case 'cervical palatal':
            {
                // Curved band from SVG
                const cervicalY = height - (70 * sy);
                const bottomOffset = 8 * sy;
                const topOffset = 1.9 * sy;

                ctx.moveTo(0, cervicalY + topOffset);
                ctx.bezierCurveTo(0, cervicalY + topOffset, 16.4 * sx, cervicalY, 27 * sx, cervicalY);
                ctx.bezierCurveTo(37.5 * sx, cervicalY, width, cervicalY + topOffset, width, cervicalY + topOffset);
                ctx.lineTo(width, cervicalY + bottomOffset);
                ctx.bezierCurveTo(width, cervicalY + bottomOffset, 37.5 * sx, cervicalY + (6.1 * sy), 27 * sx, cervicalY + (6.1 * sy));
                ctx.bezierCurveTo(16.4 * sx, cervicalY + (6.1 * sy), 0, cervicalY + bottomOffset, 0, cervicalY + bottomOffset);
                ctx.lineTo(0, cervicalY + topOffset);
            }
            break;
    }

    ctx.closePath();
    ctx.restore();
}
