/**
 * Smooth a closed polygon contour into a beveled SVG path.
 *
 * Uses the midpoint-quadratic technique: between each pair of original points
 * we compute the midpoint and draw quadratic Bézier curves using the original
 * vertex as the control point. This removes the blocky/square corners produced by
 * raw segmentation masks while keeping the overall tooth shape.
 *
 * @param {Array<[number, number]>} points - closed or open polygon points
 * @returns {string} SVG path `d` attribute
 */
export function smoothContourToPath(points) {
    if (!points || points.length < 3) return '';

    const len = points.length;

    // Helpers
    const mid = (a, b) => ({
        x: (a[0] + b[0]) / 2,
        y: (a[1] + b[1]) / 2,
    });

    const start = mid(points[len - 1], points[0]);
    let d = `M ${start.x} ${start.y}`;

    for (let i = 0; i < len; i++) {
        const curr = points[i];
        const next = points[(i + 1) % len];
        const m = mid(curr, next);
        d += ` Q ${curr[0]} ${curr[1]}, ${m.x} ${m.y}`;
    }

    d += ' Z';
    return d;
}

/**
 * Optional: apply a simple moving-average smoothing pass before path generation.
 * Useful when the raw contour is extremely noisy or pixelated.
 *
 * @param {Array<[number, number]>} points
 * @param {number} passes
 * @returns {Array<[number, number]>}
 */
export function movingAverageSmooth(points, passes = 1) {
    if (!points || points.length < 3) return points;
    const len = points.length;
    let result = points.map((p) => [p[0], p[1]]);

    for (let p = 0; p < passes; p++) {
        const smoothed = [];
        for (let i = 0; i < len; i++) {
            const prev = result[(i - 1 + len) % len];
            const curr = result[i];
            const next = result[(i + 1) % len];
            smoothed.push([
                (prev[0] + curr[0] + next[0]) / 3,
                (prev[1] + curr[1] + next[1]) / 3,
            ]);
        }
        result = smoothed;
    }

    return result;
}
