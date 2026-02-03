import React, { useRef, useEffect } from 'react';
import { maskEngine } from './MaskEngine';
import { drawToothSurface, getToothType } from '../../utils/svgPaths';
import { shouldMirror, getToothImage, mapViewToImageView, getToothCondition } from '../../utils/toothUtils';
import './ToothRenderer.css';

const ToothRenderer = ({
    toothNumber,
    view = 'frontal',
    conditions = [],
    interactive = false,
    onSurfaceClick,
    isSelected = false,
    toothData = null,
    className = ''
}) => {
    const isMirrored = shouldMirror(toothNumber);
    const type = getToothType(toothNumber);
    const canvasRef = useRef(null);
    const fallbackCanvasRef = useRef(null);

    const imageView = mapViewToImageView(view, toothNumber);
    const condition = toothData ? getToothCondition(toothData) : 'withRoots';
    const toothImagePath = getToothImage(toothNumber, condition, imageView);

    const surfaces = view === 'topview'
        ? ['O', 'M', 'D', 'B', 'L']
        : view === 'lingual'
            ? ['L', 'M', 'D']
            : ['B', 'M', 'D'];

    const baseColor = '#FFFFFF';
    const strokeColor = '#E0E0E0';

    // Draw conditions on overlay canvas (when image is available)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !toothImagePath) return;

        const ctx = canvas.getContext('2d');
        const width = 100;
        const height = view === 'frontal' ? 150 : 100;
        const scale = 2;

        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);

        // Helper to check if condition is visible in current view
        const isConditionVisible = (condition, currentView) => {
            if (!condition.zone) return true; // Determine visibility by surface alone if zone missing

            const zoneLower = String(condition.zone).toLowerCase();
            const isFrontalView = currentView === 'frontal' || currentView === 'buccal' || currentView === 'labial';
            const isLingualView = currentView === 'lingual' || currentView === 'palatal' || currentView === 'inside';

            // Define side-specific keywords
            const buccalKeywords = ['buccal', 'labial']; // Front side
            const lingualKeywords = ['lingual', 'palatal']; // Back side

            const isBuccalCondition = buccalKeywords.some(k => zoneLower.includes(k));
            const isLingualCondition = lingualKeywords.some(k => zoneLower.includes(k));

            if (isFrontalView) {
                // In frontal view, hide lingual/palatal conditions
                if (isLingualCondition) return false;
            }
            else if (isLingualView) {
                // In lingual view, hide buccal/labial conditions
                if (isBuccalCondition) return false;
            }

            return true;
        };

        // Prepare conditions with tooth info for MaskEngine
        const conditionsWithInfo = conditions.map(cond => ({
            ...cond,
            toothNumber,
            view
        })).filter(c => c.surface && isConditionVisible(c, view));

        const maskImagePath = getToothImage(toothNumber, 'withRoots', imageView);

        if (conditionsWithInfo.length > 0) {
            maskEngine.drawMaskedConditions(ctx, maskImagePath, conditionsWithInfo, width, height);
        } else {
            ctx.clearRect(0, 0, width, height);
        }

    }, [conditions, toothNumber, view, imageView, toothImagePath]);

    // Draw fallback canvas (when no image available)
    useEffect(() => {
        const canvas = fallbackCanvasRef.current;
        if (!canvas || toothImagePath) return;

        const ctx = canvas.getContext('2d');
        const width = 100;
        const height = view === 'frontal' ? 150 : 100;
        const scale = 2;

        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);
        ctx.clearRect(0, 0, width, height);

        // Draw base tooth surfaces
        ctx.fillStyle = baseColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;

        surfaces.forEach(surface => {
            drawToothSurface(ctx, toothNumber, view, surface);
            ctx.fill();
            ctx.stroke();
        });

        // Draw root for frontal view
        if (view === 'frontal') {
            ctx.fillStyle = '#F5F5F5';
            drawToothSurface(ctx, toothNumber, view, 'root');
            ctx.fill();
            ctx.stroke();
        }

        // Draw conditions
        conditions.forEach(cond => {
            ctx.fillStyle = cond.color || 'transparent';
            ctx.globalAlpha = cond.opacity || 0.7;
            drawToothSurface(ctx, toothNumber, view, cond.surface);
            ctx.fill();
            if (cond.stroke && cond.stroke !== 'none') {
                ctx.strokeStyle = cond.stroke;
                ctx.lineWidth = cond.strokeWidth || 1;
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
        });

    }, [conditions, toothNumber, view, surfaces, toothImagePath]);

    // Handle interactive clicks on canvas
    const handleCanvasClick = (e) => {
        if (!interactive || !onSurfaceClick) return;

        const canvas = toothImagePath ? canvasRef.current : fallbackCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const width = 100;
        const height = view === 'frontal' ? 150 : 100;

        const scaleX = width / rect.width;
        const scaleY = height / rect.height;

        let mouseX = (e.clientX - rect.left) * scaleX;
        let mouseY = (e.clientY - rect.top) * scaleY;

        const isRotated = imageRotation !== 'none';

        // Account for rotation (180 deg)
        if (isRotated) {
            mouseX = width - mouseX;
            mouseY = height - mouseY;
        }

        // Account for mirroring
        if (isMirrored) {
            mouseX = width - mouseX;
        }

        // Check which surface was clicked
        const ctx = canvas.getContext('2d');
        let clickedSurface = null;

        for (const surface of surfaces) {
            drawToothSurface(ctx, toothNumber, view, surface);
            if (ctx.isPointInPath(mouseX, mouseY)) {
                clickedSurface = surface;
            }
        }

        if (clickedSurface) {
            onSurfaceClick(clickedSurface);
        }
    };

    const tNum = parseInt(toothNumber, 10);
    const isUpperJaw = (tNum >= 11 && tNum <= 28) || (tNum >= 51 && tNum <= 65);
    const jawClass = isUpperJaw ? 'upper-jaw' : 'lower-jaw';

    let imageScale = 0.9;
    let imageRotation = 'none';
    const isBuccalView = view === 'frontal' || view === 'buccal';

    if (!isUpperJaw && isBuccalView) {
        imageRotation = 'rotate(180deg)';
    }

    return (
        <div
            className={`tooth-renderer ${jawClass} ${isSelected ? 'selected' : ''} ${className}`}
            style={{
                transform: isMirrored ? 'scaleX(-1)' : 'none'
            }}
        >
            <div className="tooth-inner">
                {toothImagePath ? (
                    <>
                        <img
                            src={toothImagePath}
                            alt={`Tooth ${toothNumber} - ${imageView} view`}
                            className="tooth-image"
                            style={{
                                scale: `${imageScale}`,
                                transform: imageRotation
                            }}
                        />
                        <canvas
                            ref={canvasRef}
                            className="tooth-overlay-canvas"
                            onClick={handleCanvasClick}
                            style={{
                                cursor: interactive ? 'pointer' : 'default',
                                scale: `${imageScale}`,
                                transform: imageRotation
                            }}
                        />
                    </>
                ) : (
                    <canvas
                        ref={fallbackCanvasRef}
                        className="tooth-fallback-canvas"
                        onClick={handleCanvasClick}
                        style={{ cursor: interactive ? 'pointer' : 'default' }}
                    />
                )}
            </div>
        </div>
    );
};

export default ToothRenderer;
