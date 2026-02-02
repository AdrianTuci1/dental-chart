import { traceRoundedRect, traceCircle, traceSvgPath, DIMS } from './constants';

/**
 * MASK CONFIGURATION
 * Adjust these values to fine-tune alignment
 */
const SCALE = 0.96;
const OFFSET_X = 0; // + moves right, - moves left
const OFFSET_Y = 0; // + moves down, - moves up

const MOLAR_SVG_W = 670;
const MOLAR_SVG_H = 708;

export const drawMolarTop = (ctx, surface, w, h) => {
    ctx.save();
    // Apply centering + manual offset + scaling
    ctx.translate((w * (1 - SCALE) / 2) + OFFSET_X, (h * (1 - SCALE) / 2) + OFFSET_Y);
    ctx.scale(SCALE, SCALE);

    // Scale factors: SVG(670x708) -> Canvas(w,h)
    // Note: This maintains aspect ratio of SVG relative to canvas shape
    const sx = w / MOLAR_SVG_W;
    const sy = h / MOLAR_SVG_H;

    ctx.beginPath();

    switch (surface) {
        case 'occlusal':
            // Center 4-pointed shape
            traceSvgPath(ctx, "M136.5 243.014C136.5 243.014 199.473 280.71 271 300.014C294.521 306.362 315.208 270.05 338.5 269.514C354.933 269.136 390.478 304.115 407 300.014C479.017 282.139 530.5 243.014 530.5 243.014C530.5 243.014 450.567 303.558 449.491 348.014C448.379 393.914 530.5 457.014 530.5 457.014C530.5 457.014 470.572 433.384 407 420.743C385.243 416.417 358.854 450.378 338.5 450.014C319.497 449.674 296.092 417.517 275.5 420.743C202.39 432.195 136.5 457.014 136.5 457.014C136.5 457.014 219.552 393.988 218.43 348.014C217.343 303.482 136.5 243.014 136.5 243.014Z", sx, sy);
            break;

        case 'distal':
            // Right petal
            traceSvgPath(ctx, "M457 349.514C457 311.228 503.344 276.545 531 251.338C558.997 225.82 591.413 158.514 608.5 158.514C642.466 158.514 670 272.47 670 349.514C670 426.557 642.466 531.514 608.5 531.514C591.413 531.514 558.997 473.207 531 447.689C503.344 422.482 457 387.799 457 349.514Z", sx, sy);
            break;

        case 'mesial':
            // Left petal
            traceSvgPath(ctx, "M213 349.014C213 387.299 166.656 421.982 139 447.189C111.003 472.707 78.587 540.014 61.5 540.014C27.5345 540.014 0 426.057 0 349.014C0 271.97 27.5345 167.014 61.5 167.014C78.587 167.014 111.003 225.32 139 250.838C166.656 276.045 213 310.728 213 349.014Z", sx, sy);
            break;

        case 'mesio-buccal cusp':
        case 'buccal cusp': // Fallback if general
            // Top Left
            traceSvgPath(ctx, "M343.5 9.51373C368.3 28.0248 317.169 119.466 326 165.514C332.087 197.252 346.971 218.515 343.5 243.014C339.47 271.461 312.031 272.764 305.5 281.514C285.183 308.733 204.241 281.098 142.5 235.014C80.7591 188.929 55.1832 152.733 75.5 125.514C95.8168 98.2946 281.759 -36.5708 343.5 9.51373Z", sx, sy);
            break;

        case 'mesio-palatal cusp':
        case 'palatal cusp': // Fallback
            // Bottom Left
            traceSvgPath(ctx, "M367 689.014C353 651.014 337.67 590.782 341 544.014C343.295 511.779 351.84 493.93 345.5 470.014C333.5 447.514 305.019 441.431 297.5 433.514C274.11 408.885 210 439.014 132.5 465.014C76.6345 518.068 52.9134 593.579 76.303 618.208C99.6926 642.837 383.5 749.014 367 689.014Z", sx, sy);
            break;

        case 'disto-buccal cusp':
            // Top Right
            traceSvgPath(ctx, "M588 155.514C570.647 229.792 428.576 296.24 395.501 288.513C362.426 280.787 318.771 179.901 336.124 105.623C353.477 31.345 386.925 8.78685 420 16.5137C453.075 24.2406 605.353 81.2359 588 155.514Z", sx, sy);
            break;

        case 'disto-palatal cusp':
            // Bottom Right
            traceSvgPath(ctx, "M376.333 672.841C324.753 616.646 349.928 461.837 374.95 438.869C399.973 415.901 507.914 436.695 559.494 492.889C611.074 549.084 610.858 589.428 585.835 612.396C560.813 635.363 427.912 729.036 376.333 672.841Z", sx, sy);
            break;

        case 'surface':
        case 'buccal':
        case 'palatal':
            // Full crown surface logic for Top View (simplified coverage of all cusps)
            // We can use a large rounded rect or a union of cusps. 
            // For now, let's use a rectangle covering the main occlusal table.
            traceRoundedRect(ctx, 60 * sx, 100 * sy, 550 * sx, 500 * sy, 50 * sx); // Approx center
            break;

    }
    ctx.closePath();
    ctx.restore();
};

export const drawMolarFrontal = (ctx, surface, w, h) => {
    ctx.save();
    // Apply centering + manual offset + scaling
    ctx.translate((w * (1 - SCALE) / 2) + OFFSET_X, (h * (1 - SCALE) / 2) + OFFSET_Y);
    ctx.scale(SCALE, SCALE);

    // Reference 54x172 (from maskslayout)
    const sx = w / DIMS.FRONT_W;
    const sy = h / DIMS.FRONT_H;

    ctx.beginPath();

    switch (surface) {
        case 'mesio-buccal cusp':
        case 'buccal cusp':
            // Bottom left half
            traceRoundedRect(ctx, 0, h - (60 * sy), 27 * sx, 60 * sy, 4 * sx);
            break;

        case 'disto-buccal cusp':
            // Bottom right half
            traceRoundedRect(ctx, 27 * sx, h - (60 * sy), 27 * sx, 60 * sy, 4 * sx);
            break;

        case 'mesial':
            // Bottom left corner
            traceRoundedRect(ctx, 0, h - (35 * sy), 14 * sx, 35 * sy, 4 * sx);
            break;

        case 'distal':
            // Bottom right corner
            traceRoundedRect(ctx, 40 * sx, h - (35 * sy), 14 * sx, 35 * sy, 4 * sx);
            break;

        case 'buccal':
        case 'palatal':
        case 'buccal point':
            // Center point at bottom
            traceCircle(ctx, 27 * sx, h - (25 * sy), 5 * sx);
            break;

        case 'cervical':
        case 'cervical buccal':
        case 'cervical palatal':
            {
                // Curved band from SVG
                const cervicalY = h - (70 * sy);
                const bottomOffset = 8 * sy;
                const topOffset = 1.9 * sy;

                ctx.moveTo(0, cervicalY + topOffset);
                ctx.bezierCurveTo(0, cervicalY + topOffset, 16.4 * sx, cervicalY, 27 * sx, cervicalY);
                ctx.bezierCurveTo(37.5 * sx, cervicalY, w, cervicalY + topOffset, w, cervicalY + topOffset);
                ctx.lineTo(w, cervicalY + bottomOffset);
                ctx.bezierCurveTo(w, cervicalY + bottomOffset, 37.5 * sx, cervicalY + (6.1 * sy), 27 * sx, cervicalY + (6.1 * sy));
                ctx.bezierCurveTo(16.4 * sx, cervicalY + (6.1 * sy), 0, cervicalY + bottomOffset, 0, cervicalY + bottomOffset);
                ctx.lineTo(0, cervicalY + topOffset);
            }
            break;

        case 'surface':
            // Full Crown Surface for Frontal View (Covers both cusps)
            // Just below cervical line up to bottom
            const surfH = 60 * sy;
            const surfY = h - surfH;
            traceRoundedRect(ctx, 0, surfY, w, surfH, 4 * sx);
            break;
    }

    ctx.closePath();
    ctx.restore();
};
