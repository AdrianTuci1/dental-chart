import React, { useRef, useEffect, useState } from 'react';
import './WaveInteractiveView.css';

const WaveInteractiveView = ({ children, viewType, direction = 'down', alignment = 'center' }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [points, setPoints] = useState(null);
    const [draggingPoint, setDraggingPoint] = useState(null);

    // Initialize points based on direction
    useEffect(() => {
        if (!containerRef.current) return;

        const baseLine = 0.5;
        // Direction 'up': Peak points UP (smaller Y).
        // Direction 'down': Peak points DOWN (larger Y).
        const bulge = direction === 'up' ? -0.15 : 0.15;
        const curveDirection = direction === 'up' ? 0.1 : -0.1;

        if (!points) {
            setPoints({
                start: { x: 0, y: baseLine + curveDirection },
                c1: { x: 0.25, y: baseLine + curveDirection },
                peak: { x: 0.5, y: baseLine + bulge },
                c2: { x: 0.75, y: baseLine + curveDirection },
                end: { x: 1, y: baseLine + curveDirection }
            });
        }
    }, [direction]);

    const draw = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !points) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = container.getBoundingClientRect();

        // Handle High DPI
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.clearRect(0, 0, width, height);

        // 1. Draw Background Grid Lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);

        const lineCount = 16;
        // Start from the wave's start anchor Y level
        const startY = points.start.y * height;
        // Draw downwards
        // Need to ensure we don't go out of bounds? 
        // Or if startY is 0.6*height, we draw 16 lines down from there.
        // Let's assume we fill the space below the line.
        const availableHeight = height - startY;
        // If startY is very low, step will be small. That's fine.
        // If startY is high, step is larger.
        const step = availableHeight / lineCount;

        for (let i = 1; i <= lineCount; i++) {
            const y = startY + (step * i);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 2. Draw Wave (Bezier)
        const p = {
            start: { x: points.start.x * width, y: points.start.y * height },
            c1: { x: points.c1.x * width, y: points.c1.y * height },
            peak: { x: points.peak.x * width, y: points.peak.y * height },
            c2: { x: points.c2.x * width, y: points.c2.y * height },
            end: { x: points.end.x * width, y: points.end.y * height }
        };

        ctx.setLineDash([]);
        ctx.strokeStyle = '#FF3B30';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(p.start.x, p.start.y);
        ctx.quadraticCurveTo(p.c1.x, p.c1.y, p.peak.x, p.peak.y);
        ctx.quadraticCurveTo(p.c2.x, p.c2.y, p.end.x, p.end.y);
        ctx.stroke();

        // 3. Draw Control Points
        const radius = 6;
        const drawPoint = (pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
            ctx.fill();
        };

        ctx.fillStyle = 'rgba(255, 59, 48, 0.5)';
        drawPoint(p.c1);
        drawPoint(p.peak);
        drawPoint(p.c2);
    };

    useEffect(() => {
        draw();
        window.addEventListener('resize', draw);
        return () => window.removeEventListener('resize', draw);
    }, [points]);

    // Interaction Handlers
    const getMousePos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height
        };
    };

    const handleMouseDown = (e) => {
        const pos = getMousePos(e);
        const threshold = 0.05;

        const check = (ptName) => {
            const pt = points[ptName];
            const dx = pt.x - pos.x;
            const dy = pt.y - pos.y;
            return (dx * dx) + (dy * dy) < (threshold * threshold);
        };

        if (check('peak')) setDraggingPoint('peak');
        else if (check('c1')) setDraggingPoint('c1');
        else if (check('c2')) setDraggingPoint('c2');
        else if (check('start') && e.shiftKey) setDraggingPoint('start');
        else if (check('end') && e.shiftKey) setDraggingPoint('end');
    };

    const handleMouseMove = (e) => {
        if (!draggingPoint) return;
        const pos = getMousePos(e);

        setPoints(prev => ({
            ...prev,
            [draggingPoint]: { x: prev[draggingPoint].x, y: pos.y }
        }));

        if (draggingPoint === 'start' || draggingPoint === 'end') {
            setPoints(prev => ({
                ...prev,
                [draggingPoint]: { x: prev[draggingPoint].x, y: pos.y }
            }));
        } else {
            setPoints(prev => ({
                ...prev,
                [draggingPoint]: { x: pos.x, y: pos.y }
            }));
        }
    };

    const handleMouseUp = () => {
        setDraggingPoint(null);
    };

    return (
        <div className="wave-interactive-wrapper" ref={containerRef}>
            <div
                className="wave-content"
                style={{ alignItems: alignment }}
            >
                {children}
            </div>
            <canvas
                ref={canvasRef}
                className="wave-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
};

export default WaveInteractiveView;
