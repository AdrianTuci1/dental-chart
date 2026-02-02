export const getToothType = (toothNumber) => {
    const n = parseInt(toothNumber);
    const index = n % 10;

    if (index === 1 || index === 2) return 'incisor';
    if (index === 3) return 'canine';
    if (index === 4 || index === 5) return 'premolar';
    if (index >= 6) return 'molar';
    return 'molar';
};

// Helper: Draw a rounded rectangle
const roundedRect = (ctx, x, y, width, height, radius) => {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
};

// Helper: Draw a small circle (point)
const circle = (ctx, cx, cy, radius) => {
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
};

// Helper: Executes canvas drawing commands for tooth shapes
// Canvas is assumed to be 100x100 coordinate system
const drawPath = (ctx, type) => {
    ctx.beginPath();
    switch (type) {
        // ===========================================
        // TOPVIEW - 6 zones + occlusal center
        // Layout: Mesial(left 25%), Distal(right 25%)
        //         Mesio-buccal(top-left 50%), Disto-buccal(top-right 50%)
        //         Mesio-palatal(bottom-left 50%), Disto-palatal(bottom-right 50%)
        //         Occlusal(center)
        // ===========================================

        // --- MOLAR TOPVIEW ---
        case 'molar_topview_O':
        case 'molar_topview_occlusal':
            // Occlusal: rectangle with elongated corners and curved top/bottom
            ctx.moveTo(30, 40);
            ctx.quadraticCurveTo(50, 35, 70, 40); // curved top (bulging up)
            ctx.lineTo(75, 45);
            ctx.lineTo(75, 55);
            ctx.quadraticCurveTo(50, 65, 30, 60); // curved bottom (bulging down)
            ctx.lineTo(25, 55);
            ctx.lineTo(25, 45);
            ctx.closePath();
            break;
        case 'molar_topview_M':
        case 'molar_topview_mesial':
            // Mesial: left side strip, 25% width (0-25)
            roundedRect(ctx, 0, 15, 25, 70, 8);
            ctx.closePath();
            break;
        case 'molar_topview_D':
        case 'molar_topview_distal':
            // Distal: right side strip, 25% width (75-100)
            roundedRect(ctx, 75, 15, 25, 70, 8);
            ctx.closePath();
            break;
        case 'molar_topview_B':
        case 'molar_topview_buccal':
            // Mesio-buccal cusp: top-left 50% (for general buccal)
            roundedRect(ctx, 20, 0, 60, 25, 6);
            ctx.closePath();
            break;
        case 'molar_topview_L':
        case 'molar_topview_palatal':
            // Mesio-palatal cusp: bottom-left 50% (for general palatal)
            roundedRect(ctx, 20, 75, 60, 25, 6);
            ctx.closePath();
            break;
        case 'molar_topview_mesio-buccal cusp':
            // Top-left quadrant (50% of top area)
            roundedRect(ctx, 20, 0, 30, 30, 6);
            ctx.closePath();
            break;
        case 'molar_topview_disto-buccal cusp':
            // Top-right quadrant (50% of top area)
            roundedRect(ctx, 50, 0, 30, 30, 6);
            ctx.closePath();
            break;
        case 'molar_topview_mesio-palatal cusp':
            // Bottom-left quadrant (50% of bottom area)
            roundedRect(ctx, 20, 70, 30, 30, 6);
            ctx.closePath();
            break;
        case 'molar_topview_disto-palatal cusp':
            // Bottom-right quadrant (50% of bottom area)
            roundedRect(ctx, 50, 70, 30, 30, 6);
            ctx.closePath();
            break;

        // --- MOLAR FRONTAL (Buccal View) ---
        case 'molar_frontal_B':
        case 'molar_frontal_buccal surface':
            // Full buccal surface
            ctx.moveTo(10, 20);
            ctx.bezierCurveTo(30, 10, 70, 10, 90, 20);
            ctx.bezierCurveTo(95, 60, 95, 100, 90, 120);
            ctx.bezierCurveTo(70, 130, 30, 130, 10, 120);
            ctx.bezierCurveTo(5, 100, 5, 60, 10, 20);
            ctx.closePath();
            break;
        case 'molar_frontal_buccal':
            // Central point - small circle in center of crown
            circle(ctx, 50, 60, 5);
            ctx.closePath();
            break;
        case 'molar_frontal_cervical buccal':
            // Cervical: thin wavy horizontal line below crown
            ctx.moveTo(10, 115);
            ctx.quadraticCurveTo(30, 120, 50, 115);
            ctx.quadraticCurveTo(70, 110, 90, 115);
            ctx.lineTo(90, 118);
            ctx.quadraticCurveTo(70, 113, 50, 118);
            ctx.quadraticCurveTo(30, 123, 10, 118);
            ctx.closePath();
            break;
        case 'molar_frontal_buccal cusp':
        case 'molar_frontal_mesio-buccal cusp':
            // Mesio-buccal cusp: left half of crown (50%)
            roundedRect(ctx, 5, 15, 45, 70, 8);
            ctx.closePath();
            break;
        case 'molar_frontal_disto-buccal cusp':
            // Disto-buccal cusp: right half of crown (50%)
            roundedRect(ctx, 50, 15, 45, 70, 8);
            ctx.closePath();
            break;
        case 'molar_frontal_M':
        case 'molar_frontal_mesial':
            // Mesial: rounded rectangle at top-left corner, 25% width
            roundedRect(ctx, 0, 0, 25, 35, 6);
            ctx.closePath();
            break;
        case 'molar_frontal_D':
        case 'molar_frontal_distal':
            // Distal: rounded rectangle at top-right corner, 25% width
            roundedRect(ctx, 75, 0, 25, 35, 6);
            ctx.closePath();
            break;
        case 'molar_frontal_root':
            ctx.moveTo(25, 120);
            ctx.bezierCurveTo(30, 140, 40, 180, 50, 190);
            ctx.bezierCurveTo(60, 180, 70, 140, 75, 120);
            ctx.closePath();
            break;

        // --- MOLAR LINGUAL (Palatal View) ---
        case 'molar_lingual_L':
        case 'molar_lingual_palatal surface':
            ctx.moveTo(10, 20);
            ctx.bezierCurveTo(30, 10, 70, 10, 90, 20);
            ctx.bezierCurveTo(95, 60, 95, 100, 90, 120);
            ctx.bezierCurveTo(70, 130, 30, 130, 10, 120);
            ctx.bezierCurveTo(5, 100, 5, 60, 10, 20);
            ctx.closePath();
            break;
        case 'molar_lingual_palatal':
            // Central point - small circle in center of crown
            circle(ctx, 50, 60, 5);
            ctx.closePath();
            break;
        case 'molar_lingual_cervical palatal':
            // Cervical: thin wavy horizontal line below crown
            ctx.moveTo(10, 115);
            ctx.quadraticCurveTo(30, 120, 50, 115);
            ctx.quadraticCurveTo(70, 110, 90, 115);
            ctx.lineTo(90, 118);
            ctx.quadraticCurveTo(70, 113, 50, 118);
            ctx.quadraticCurveTo(30, 123, 10, 118);
            ctx.closePath();
            break;
        case 'molar_lingual_palatal cusp':
        case 'molar_lingual_mesio-palatal cusp':
            // Mesio-palatal cusp: left half of crown (50%)
            roundedRect(ctx, 5, 15, 45, 70, 8);
            ctx.closePath();
            break;
        case 'molar_lingual_disto-palatal cusp':
            // Disto-palatal cusp: right half of crown (50%)
            roundedRect(ctx, 50, 15, 45, 70, 8);
            ctx.closePath();
            break;
        case 'molar_lingual_M':
        case 'molar_lingual_mesial':
            // Mesial: rounded rectangle at top-left corner, 25% width
            roundedRect(ctx, 0, 0, 25, 35, 6);
            ctx.closePath();
            break;
        case 'molar_lingual_D':
        case 'molar_lingual_distal':
            // Distal: rounded rectangle at top-right corner, 25% width
            roundedRect(ctx, 75, 0, 25, 35, 6);
            ctx.closePath();
            break;

        // ===========================================
        // PREMOLAR - TOPVIEW
        // ===========================================
        case 'premolar_topview_O':
        case 'premolar_topview_occlusal':
            // Occlusal: rectangle with elongated corners and curved top/bottom
            ctx.moveTo(32, 42);
            ctx.quadraticCurveTo(50, 38, 68, 42);
            ctx.lineTo(72, 47);
            ctx.lineTo(72, 53);
            ctx.quadraticCurveTo(50, 62, 32, 58);
            ctx.lineTo(28, 53);
            ctx.lineTo(28, 47);
            ctx.closePath();
            break;
        case 'premolar_topview_M':
        case 'premolar_topview_mesial':
            roundedRect(ctx, 0, 20, 25, 60, 8);
            ctx.closePath();
            break;
        case 'premolar_topview_D':
        case 'premolar_topview_distal':
            roundedRect(ctx, 75, 20, 25, 60, 8);
            ctx.closePath();
            break;
        case 'premolar_topview_B':
        case 'premolar_topview_buccal':
            roundedRect(ctx, 22, 0, 56, 25, 6);
            ctx.closePath();
            break;
        case 'premolar_topview_L':
        case 'premolar_topview_palatal':
            roundedRect(ctx, 22, 75, 56, 25, 6);
            ctx.closePath();
            break;
        case 'premolar_topview_buccal cusp':
            roundedRect(ctx, 22, 0, 56, 25, 6);
            ctx.closePath();
            break;
        case 'premolar_topview_palatal cusp':
            roundedRect(ctx, 22, 75, 56, 25, 6);
            ctx.closePath();
            break;

        // --- PREMOLAR FRONTAL ---
        case 'premolar_frontal_B':
        case 'premolar_frontal_buccal surface':
            ctx.moveTo(20, 22);
            ctx.bezierCurveTo(35, 12, 65, 12, 80, 22);
            ctx.bezierCurveTo(85, 55, 85, 90, 80, 110);
            ctx.bezierCurveTo(65, 120, 35, 120, 20, 110);
            ctx.bezierCurveTo(15, 90, 15, 55, 20, 22);
            ctx.closePath();
            break;
        case 'premolar_frontal_buccal':
            // Central point - small circle
            circle(ctx, 50, 60, 5);
            ctx.closePath();
            break;
        case 'premolar_frontal_cervical buccal':
            // Cervical: thin wavy line
            ctx.moveTo(18, 108);
            ctx.quadraticCurveTo(35, 113, 50, 108);
            ctx.quadraticCurveTo(65, 103, 82, 108);
            ctx.lineTo(82, 111);
            ctx.quadraticCurveTo(65, 106, 50, 111);
            ctx.quadraticCurveTo(35, 116, 18, 111);
            ctx.closePath();
            break;
        case 'premolar_frontal_buccal cusp':
            // Buccal cusp: full top area for premolar
            roundedRect(ctx, 15, 15, 70, 45, 8);
            ctx.closePath();
            break;
        case 'premolar_frontal_M':
        case 'premolar_frontal_mesial':
            roundedRect(ctx, 0, 0, 25, 35, 6);
            ctx.closePath();
            break;
        case 'premolar_frontal_D':
        case 'premolar_frontal_distal':
            roundedRect(ctx, 75, 0, 25, 35, 6);
            ctx.closePath();
            break;
        case 'premolar_frontal_root':
            ctx.moveTo(35, 110);
            ctx.bezierCurveTo(40, 135, 48, 170, 50, 180);
            ctx.bezierCurveTo(52, 170, 60, 135, 65, 110);
            ctx.closePath();
            break;

        // --- PREMOLAR LINGUAL ---
        case 'premolar_lingual_L':
        case 'premolar_lingual_palatal surface':
            ctx.moveTo(20, 22);
            ctx.bezierCurveTo(35, 12, 65, 12, 80, 22);
            ctx.bezierCurveTo(85, 55, 85, 90, 80, 110);
            ctx.bezierCurveTo(65, 120, 35, 120, 20, 110);
            ctx.bezierCurveTo(15, 90, 15, 55, 20, 22);
            ctx.closePath();
            break;
        case 'premolar_lingual_palatal':
            circle(ctx, 50, 60, 5);
            ctx.closePath();
            break;
        case 'premolar_lingual_cervical palatal':
            ctx.moveTo(18, 108);
            ctx.quadraticCurveTo(35, 113, 50, 108);
            ctx.quadraticCurveTo(65, 103, 82, 108);
            ctx.lineTo(82, 111);
            ctx.quadraticCurveTo(65, 106, 50, 111);
            ctx.quadraticCurveTo(35, 116, 18, 111);
            ctx.closePath();
            break;
        case 'premolar_lingual_palatal cusp':
            roundedRect(ctx, 15, 15, 70, 45, 8);
            ctx.closePath();
            break;
        case 'premolar_lingual_M':
        case 'premolar_lingual_mesial':
            roundedRect(ctx, 0, 0, 25, 35, 6);
            ctx.closePath();
            break;
        case 'premolar_lingual_D':
        case 'premolar_lingual_distal':
            roundedRect(ctx, 75, 0, 25, 35, 6);
            ctx.closePath();
            break;

        // ===========================================
        // CANINE - TOPVIEW
        // ===========================================
        case 'canine_topview_O':
        case 'canine_topview_occlusal':
            // Canine cusp point - elongated diamond shape
            ctx.moveTo(50, 35);
            ctx.quadraticCurveTo(60, 45, 55, 50);
            ctx.quadraticCurveTo(55, 60, 50, 65);
            ctx.quadraticCurveTo(40, 60, 45, 50);
            ctx.quadraticCurveTo(40, 45, 50, 35);
            ctx.closePath();
            break;
        case 'canine_topview_M':
        case 'canine_topview_mesial':
            roundedRect(ctx, 0, 20, 25, 60, 8);
            ctx.closePath();
            break;
        case 'canine_topview_D':
        case 'canine_topview_distal':
            roundedRect(ctx, 75, 20, 25, 60, 8);
            ctx.closePath();
            break;
        case 'canine_topview_B':
        case 'canine_topview_buccal':
            roundedRect(ctx, 25, 0, 50, 25, 6);
            ctx.closePath();
            break;
        case 'canine_topview_L':
        case 'canine_topview_palatal':
            roundedRect(ctx, 25, 75, 50, 25, 6);
            ctx.closePath();
            break;

        // --- CANINE FRONTAL ---
        case 'canine_frontal_B':
        case 'canine_frontal_buccal surface':
            ctx.moveTo(30, 22);
            ctx.bezierCurveTo(42, 10, 58, 10, 70, 22);
            ctx.bezierCurveTo(75, 50, 70, 90, 55, 115);
            ctx.bezierCurveTo(50, 120, 50, 120, 45, 115);
            ctx.bezierCurveTo(30, 90, 25, 50, 30, 22);
            ctx.closePath();
            break;
        case 'canine_frontal_buccal':
            circle(ctx, 50, 55, 5);
            ctx.closePath();
            break;
        case 'canine_frontal_cervical buccal':
            ctx.moveTo(35, 105);
            ctx.quadraticCurveTo(45, 110, 50, 105);
            ctx.quadraticCurveTo(55, 100, 65, 105);
            ctx.lineTo(65, 108);
            ctx.quadraticCurveTo(55, 103, 50, 108);
            ctx.quadraticCurveTo(45, 113, 35, 108);
            ctx.closePath();
            break;
        case 'canine_frontal_buccal cusp':
            // Cusp tip area - single cusp for canine
            roundedRect(ctx, 25, 10, 50, 50, 10);
            ctx.closePath();
            break;
        case 'canine_frontal_M':
        case 'canine_frontal_mesial':
            roundedRect(ctx, 0, 0, 25, 35, 6);
            ctx.closePath();
            break;
        case 'canine_frontal_D':
        case 'canine_frontal_distal':
            roundedRect(ctx, 75, 0, 25, 35, 6);
            ctx.closePath();
            break;
        case 'canine_frontal_root':
            ctx.moveTo(38, 105);
            ctx.bezierCurveTo(42, 140, 48, 185, 50, 200);
            ctx.bezierCurveTo(52, 185, 58, 140, 62, 105);
            ctx.closePath();
            break;

        // --- CANINE LINGUAL ---
        case 'canine_lingual_L':
        case 'canine_lingual_palatal surface':
            ctx.moveTo(30, 22);
            ctx.bezierCurveTo(42, 10, 58, 10, 70, 22);
            ctx.bezierCurveTo(75, 50, 70, 90, 55, 115);
            ctx.bezierCurveTo(50, 120, 50, 120, 45, 115);
            ctx.bezierCurveTo(30, 90, 25, 50, 30, 22);
            ctx.closePath();
            break;
        case 'canine_lingual_palatal':
            circle(ctx, 50, 55, 5);
            ctx.closePath();
            break;
        case 'canine_lingual_cervical palatal':
            ctx.moveTo(35, 105);
            ctx.quadraticCurveTo(45, 110, 50, 105);
            ctx.quadraticCurveTo(55, 100, 65, 105);
            ctx.lineTo(65, 108);
            ctx.quadraticCurveTo(55, 103, 50, 108);
            ctx.quadraticCurveTo(45, 113, 35, 108);
            ctx.closePath();
            break;
        case 'canine_lingual_palatal cusp':
            roundedRect(ctx, 25, 10, 50, 50, 10);
            ctx.closePath();
            break;
        case 'canine_lingual_M':
        case 'canine_lingual_mesial':
            roundedRect(ctx, 0, 0, 25, 35, 6);
            ctx.closePath();
            break;
        case 'canine_lingual_D':
        case 'canine_lingual_distal':
            roundedRect(ctx, 75, 0, 25, 35, 6);
            ctx.closePath();
            break;

        // ===========================================
        // INCISOR - TOPVIEW
        // ===========================================
        case 'incisor_topview_O':
        case 'incisor_topview_occlusal':
            // Incisal edge - horizontal elongated rectangle with curved edges
            ctx.moveTo(25, 42);
            ctx.quadraticCurveTo(50, 38, 75, 42);
            ctx.lineTo(78, 47);
            ctx.lineTo(78, 53);
            ctx.quadraticCurveTo(50, 62, 25, 58);
            ctx.lineTo(22, 53);
            ctx.lineTo(22, 47);
            ctx.closePath();
            break;
        case 'incisor_topview_M':
        case 'incisor_topview_mesial':
            roundedRect(ctx, 0, 20, 25, 60, 8);
            ctx.closePath();
            break;
        case 'incisor_topview_D':
        case 'incisor_topview_distal':
            roundedRect(ctx, 75, 20, 25, 60, 8);
            ctx.closePath();
            break;
        case 'incisor_topview_B':
        case 'incisor_topview_buccal':
            roundedRect(ctx, 22, 0, 56, 25, 6);
            ctx.closePath();
            break;
        case 'incisor_topview_L':
        case 'incisor_topview_palatal':
            roundedRect(ctx, 22, 75, 56, 25, 6);
            ctx.closePath();
            break;

        // --- INCISOR FRONTAL ---
        case 'incisor_frontal_B':
        case 'incisor_frontal_buccal surface':
            ctx.moveTo(22, 22);
            ctx.bezierCurveTo(38, 15, 62, 15, 78, 22);
            ctx.bezierCurveTo(82, 55, 82, 90, 78, 110);
            ctx.bezierCurveTo(62, 118, 38, 118, 22, 110);
            ctx.bezierCurveTo(18, 90, 18, 55, 22, 22);
            ctx.closePath();
            break;
        case 'incisor_frontal_buccal':
            circle(ctx, 50, 60, 5);
            ctx.closePath();
            break;
        case 'incisor_frontal_cervical buccal':
            ctx.moveTo(20, 108);
            ctx.quadraticCurveTo(38, 113, 50, 108);
            ctx.quadraticCurveTo(62, 103, 80, 108);
            ctx.lineTo(80, 111);
            ctx.quadraticCurveTo(62, 106, 50, 111);
            ctx.quadraticCurveTo(38, 116, 20, 111);
            ctx.closePath();
            break;
        case 'incisor_frontal_buccal cusp':
        case 'incisor_frontal_incisal edge':
            // Incisal edge - horizontal band at top
            roundedRect(ctx, 18, 15, 64, 30, 8);
            ctx.closePath();
            break;
        case 'incisor_frontal_M':
        case 'incisor_frontal_mesial':
            roundedRect(ctx, 0, 0, 25, 35, 6);
            ctx.closePath();
            break;
        case 'incisor_frontal_D':
        case 'incisor_frontal_distal':
            roundedRect(ctx, 75, 0, 25, 35, 6);
            ctx.closePath();
            break;
        case 'incisor_frontal_root':
            ctx.moveTo(35, 110);
            ctx.bezierCurveTo(40, 130, 48, 160, 50, 170);
            ctx.bezierCurveTo(52, 160, 60, 130, 65, 110);
            ctx.closePath();
            break;

        // --- INCISOR LINGUAL ---
        case 'incisor_lingual_L':
        case 'incisor_lingual_palatal surface':
            ctx.moveTo(22, 22);
            ctx.bezierCurveTo(38, 15, 62, 15, 78, 22);
            ctx.bezierCurveTo(82, 55, 82, 90, 78, 110);
            ctx.bezierCurveTo(62, 118, 38, 118, 22, 110);
            ctx.bezierCurveTo(18, 90, 18, 55, 22, 22);
            ctx.closePath();
            break;
        case 'incisor_lingual_palatal':
            circle(ctx, 50, 60, 5);
            ctx.closePath();
            break;
        case 'incisor_lingual_cervical palatal':
            ctx.moveTo(20, 108);
            ctx.quadraticCurveTo(38, 113, 50, 108);
            ctx.quadraticCurveTo(62, 103, 80, 108);
            ctx.lineTo(80, 111);
            ctx.quadraticCurveTo(62, 106, 50, 111);
            ctx.quadraticCurveTo(38, 116, 20, 111);
            ctx.closePath();
            break;
        case 'incisor_lingual_palatal cusp':
        case 'incisor_lingual_incisal edge':
            roundedRect(ctx, 18, 15, 64, 30, 8);
            ctx.closePath();
            break;
        case 'incisor_lingual_M':
        case 'incisor_lingual_mesial':
            roundedRect(ctx, 0, 0, 25, 35, 6);
            ctx.closePath();
            break;
        case 'incisor_lingual_D':
        case 'incisor_lingual_distal':
            roundedRect(ctx, 75, 0, 25, 35, 6);
            ctx.closePath();
            break;
    }
};

/**
 * Draws a tooth surface on the given canvas context.
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {string|number} toothNumber - The tooth number
 * @param {string} view - The view (topview, frontal, lingual)
 * @param {string} surface - The surface to draw (O, M, D, B, L, root, etc.)
 */
export const drawToothSurface = (ctx, toothNumber, view, surface) => {
    const type = getToothType(toothNumber);
    const key = `${type}_${view}_${surface}`;
    drawPath(ctx, key);
};
