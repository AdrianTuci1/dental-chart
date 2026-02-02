/**
 * Tooth Anatomy Helpers and Constants
 */

// Helper: Draw a rounded rectangle path (geometry only, no fill/stroke)
export const traceRoundedRect = (ctx, x, y, width, height, radius) => {
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

// Helper: Draw a circle path
export const traceCircle = (ctx, cx, cy, radius) => {
    ctx.moveTo(cx + radius, cy);
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
};

// Helper: Parse and draw SVG Path Data
// Allows pasting 'd' attribute content directly
export const traceSvgPath = (ctx, pathData, scaleX = 1, scaleY = 1) => {
    const commands = pathData.match(/[MLCQZ][^MLCQZ]*/gi);
    if (!commands) return;

    // Helper to scale coordinates
    const sx = (val) => val * scaleX;
    const sy = (val) => val * scaleY;

    commands.forEach(cmd => {
        const type = cmd[0].toUpperCase();
        const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

        switch (type) {
            case 'M':
                ctx.moveTo(sx(coords[0]), sy(coords[1]));
                break;
            case 'L':
                ctx.lineTo(sx(coords[0]), sy(coords[1]));
                break;
            case 'C':
                ctx.bezierCurveTo(
                    sx(coords[0]), sy(coords[1]),
                    sx(coords[2]), sy(coords[3]),
                    sx(coords[4]), sy(coords[5])
                );
                break;
            case 'Q':
                ctx.quadraticCurveTo(
                    sx(coords[0]), sy(coords[1]),
                    sx(coords[2]), sy(coords[3])
                );
                break;
            case 'Z':
                ctx.closePath();
                break;
        }
    });
};

// Determine tooth type based on number
export const getToothType = (toothNumber) => {
    const n = parseInt(toothNumber);
    const index = n % 10;

    if (index === 1 || index === 2 || index === 3) return 'anterior'; // Combined Incisor + Canine
    if (index === 4 || index === 5) return 'premolar';
    if (index >= 6) return 'molar';
    return 'molar';
};

// Standard Dimensions for scaling
// These match the logical dimensions used in maskslayout.html for scaling calculations
export const DIMS = {
    TOP_W: 54,
    TOP_H: 94,
    FRONT_W: 54,
    FRONT_H: 172
};
