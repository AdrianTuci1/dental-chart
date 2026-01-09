export class WaveRenderer {
    constructor() {
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.direction = 'down';
        this.values = { gm: [], pd: [] };

        // Configs
        this.LEVELS = 12;
        this.VERTICAL_SPREAD = 0.6;
        this.VERTICAL_OFFSET = -40;
        this.topicRadius = 6;
    }

    setCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    update({ width, height, direction, values }) {
        this.width = width;
        this.height = height;
        this.direction = direction;
        this.values = values;
    }

    getVerticalConfigs() {
        const contentHeight = this.height * this.VERTICAL_SPREAD;
        const totalPadding = this.height - contentHeight;

        // Invert offset for 'up' direction (Lower Jaw) to ensure symmetric separation/movement
        const effectiveOffset = this.direction === 'up' ? -this.VERTICAL_OFFSET : this.VERTICAL_OFFSET;

        // Center + Offset
        const paddingTop = (totalPadding / 2) + effectiveOffset;
        return { contentHeight, paddingTop };
    }

    getYForLevel(level) {
        const { contentHeight, paddingTop } = this.getVerticalConfigs();
        const step = contentHeight / (this.LEVELS - 1);

        if (this.direction === 'down') {
            return (paddingTop + contentHeight) - (level - 1) * step;
        } else {
            return paddingTop + (level - 1) * step;
        }
    }

    getLevelFromY(y) {
        const { contentHeight, paddingTop } = this.getVerticalConfigs();
        const step = contentHeight / (this.LEVELS - 1);

        let level;
        if (this.direction === 'down') {
            level = 1 + ((paddingTop + contentHeight) - y) / step;
        } else {
            level = 1 + (y - paddingTop) / step;
        }
        return Math.max(1, Math.min(12, Math.round(level)));
    }

    getXPositions() {
        // Distribute 5 points: 0% (Fixed), ~20-25% (Movable), 50% (Movable), ~75-80% (Movable), 100% (Fixed)
        return [0, this.width * 0.2, this.width * 0.5, this.width * 0.8, this.width];
    }

    drawSmoothLine(points) {
        if (points.length < 2) return;

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? 0 : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2] || p2;

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
    }

    addSmoothSegments(points, reverse = false) {
        const ordered = reverse ? [...points].reverse() : points;

        if (reverse) {
            this.ctx.lineTo(ordered[0].x, ordered[0].y);
        }

        for (let i = 0; i < ordered.length - 1; i++) {
            const p0 = ordered[i === 0 ? 0 : i - 1];
            const p1 = ordered[i];
            const p2 = ordered[i + 1];
            const p3 = ordered[i + 2] || p2;

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
    }

    draw() {
        if (!this.ctx || !this.width || !this.height) return;

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Draw Grid
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 4]);

        for (let i = 1; i <= this.LEVELS; i++) {
            const y = this.getYForLevel(i);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);

        const xPos = this.getXPositions();
        const fixedLevel = 1;

        const gmPoints = [
            { x: xPos[0], y: this.getYForLevel(fixedLevel) },
            { x: xPos[1], y: this.getYForLevel(this.values.gm[0]) },
            { x: xPos[2], y: this.getYForLevel(this.values.gm[1]) },
            { x: xPos[3], y: this.getYForLevel(this.values.gm[2]) },
            { x: xPos[4], y: this.getYForLevel(fixedLevel) }
        ];

        const pdPoints = [
            { x: xPos[0], y: this.getYForLevel(fixedLevel) },
            { x: xPos[1], y: this.getYForLevel(this.values.pd[0]) },
            { x: xPos[2], y: this.getYForLevel(this.values.pd[1]) },
            { x: xPos[3], y: this.getYForLevel(this.values.pd[2]) },
            { x: xPos[4], y: this.getYForLevel(fixedLevel) }
        ];

        // 2. Draw Fill
        this.ctx.beginPath();
        this.ctx.moveTo(gmPoints[0].x, gmPoints[0].y);
        this.addSmoothSegments(gmPoints, false);
        this.ctx.lineTo(pdPoints[4].x, pdPoints[4].y);
        this.addSmoothSegments(pdPoints, true);
        this.ctx.lineTo(gmPoints[0].x, gmPoints[0].y);

        this.ctx.fillStyle = 'rgba(0, 122, 255, 0.2)';
        this.ctx.fill();

        // 4. Draw PD Line
        this.ctx.strokeStyle = '#007AFF';
        this.ctx.lineWidth = 2;
        this.drawSmoothLine(pdPoints);
        this.ctx.stroke();

        // 3. Draw GM Line
        this.ctx.strokeStyle = '#FF3B30';
        this.ctx.lineWidth = 2;
        this.drawSmoothLine(gmPoints);
        this.ctx.stroke();

        // 5. Draw Control Points (REMOVED)
        // this.ctx.fillStyle = '#FF3B30';
        // gmPoints.forEach(p => {
        //     this.ctx.beginPath();
        //     this.ctx.arc(p.x, p.y, this.topicRadius, 0, Math.PI * 2);
        //     this.ctx.fill();
        // });
        // this.ctx.fillStyle = '#007AFF';
        // pdPoints.forEach(p => {
        //     this.ctx.beginPath();
        //     this.ctx.arc(p.x, p.y, this.topicRadius, 0, Math.PI * 2);
        //     this.ctx.fill();
        // });
    }

    getHit(x, y) {
        const xPos = this.getXPositions();
        const threshold = 20;

        // Check GM points
        for (let i = 0; i < 3; i++) {
            const pointIndex = i + 1;
            const py = this.getYForLevel(this.values.gm[i]);
            const dx = x - xPos[pointIndex];
            const dy = y - py;
            if (dx * dx + dy * dy < threshold * threshold) {
                return { type: 'gm', index: i };
            }
        }

        // Check PD points
        for (let i = 0; i < 3; i++) {
            const pointIndex = i + 1;
            const py = this.getYForLevel(this.values.pd[i]);
            const dx = x - xPos[pointIndex];
            const dy = y - py;
            if (dx * dx + dy * dy < threshold * threshold) {
                return { type: 'pd', index: i };
            }
        }
        return null;
    }
}
