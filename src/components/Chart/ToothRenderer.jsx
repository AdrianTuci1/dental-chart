import React, { useRef, useEffect } from 'react';
import { getSurfacePath, getToothType } from '../../utils/svgPaths';
import { shouldMirror, getToothImage, mapViewToImageView, getToothCondition } from '../../utils/toothUtils';
import './ToothRenderer.css';

const ToothRenderer = ({
    toothNumber,
    view = 'frontal',
    conditions = [],
    interactive = false,
    onSurfaceClick,
    isSelected = false,
    toothData = null // Optional tooth data to determine condition
}) => {
    const isMirrored = shouldMirror(toothNumber);
    const type = getToothType(toothNumber);
    const canvasRef = useRef(null);

    // Get the appropriate image view name
    const imageView = mapViewToImageView(view, toothNumber);

    // Get tooth condition from data or default to 'withRoots'
    const condition = toothData ? getToothCondition(toothData) : 'withRoots';

    // Try to get the tooth image
    const toothImagePath = getToothImage(toothNumber, condition, imageView);

    // Define surfaces based on view
    const surfaces = view === 'topview'
        ? ['O', 'M', 'D', 'B', 'L']
        : view === 'lingual'
            ? ['L', 'M', 'D']
            : ['B', 'M', 'D']; // Frontal/Lingual mainly show these

    // Base color for the tooth body if no image
    const baseColor = '#FFFFFF';
    const strokeColor = '#E0E0E0';

    // Draw conditions on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !toothImagePath) return;

        const ctx = canvas.getContext('2d');
        // Set canvas size to match coordinate system (100x150 for frontal, 100x100 for others)
        // We scale it up for better resolution
        const width = 100;
        const height = view === 'frontal' ? 150 : 100;
        const scale = 2; // Retina support / better quality

        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);

        ctx.clearRect(0, 0, width, height);

        conditions.forEach(condition => {
            const pathData = getSurfacePath(toothNumber, view, condition.surface);
            if (!pathData) return;

            const p = new Path2D(pathData);

            ctx.fillStyle = condition.color || 'transparent';
            ctx.globalAlpha = condition.opacity || 0.7;
            ctx.fill(p);

            if (condition.stroke && condition.stroke !== 'none') {
                ctx.strokeStyle = condition.stroke;
                ctx.lineWidth = condition.strokeWidth || 1;
                ctx.stroke(p);
            }
        });
    }, [conditions, toothNumber, view, toothImagePath]);

    // Determine if tooth is in upper jaw (11-18, 21-28, 51-55, 61-65)
    // Tooth numbers are strings or numbers, handle both
    const tNum = parseInt(toothNumber, 10);
    const isUpperJaw = (tNum >= 11 && tNum <= 28) || (tNum >= 51 && tNum <= 65);
    const jawClass = isUpperJaw ? 'upper-jaw' : 'lower-jaw';

    // Determine image scale
    // Default scale is 1.1
    // For lower jaw anterior/premolars (31-35, 41-45) in occlusal/incisal view, use 1.5
    let imageScale = 1.1;
    const isLowerAnteriorOrPremolar = (tNum >= 31 && tNum <= 35) || (tNum >= 41 && tNum <= 45);
    const isOcclusalView = view === 'topview' || view === 'occlusal' || view === 'incisal';

    if (isLowerAnteriorOrPremolar && isOcclusalView) {
        imageScale = 2.5;
    }

    return (
        <div
            className={`tooth-renderer ${jawClass} ${isSelected ? 'selected' : ''}`}
            style={{
                transform: isMirrored ? 'scaleX(-1)' : 'none'
            }}
        >
            <div className="tooth-inner">
                {/* Display tooth image if available, otherwise use SVG */}
                {toothImagePath ? (
                    <>
                        {/* Tooth Image */}
                        <img
                            src={toothImagePath}
                            alt={`Tooth ${toothNumber} - ${imageView} view`}
                            className="tooth-image"
                            style={{ scale: `${imageScale}` }}
                        />

                        {/* Canvas overlay for conditions */}
                        <canvas
                            ref={canvasRef}
                            className="tooth-overlay-canvas"
                        />

                        {/* SVG overlay for interactions ONLY */}
                        <svg
                            viewBox={view === 'frontal' ? '0 0 100 150' : '0 0 100 100'}
                            className={`tooth-overlay-svg ${interactive ? 'interactive' : ''}`}
                        >
                            {/* Interactive Layer */}
                            {interactive && surfaces.map(surface => (
                                <path
                                    key={`int-${surface}`}
                                    d={getSurfacePath(toothNumber, view, surface)}
                                    fill="transparent"
                                    className="tooth-surface-interactive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSurfaceClick && onSurfaceClick(surface);
                                    }}
                                />
                            ))}
                        </svg>
                    </>
                ) : (
                    /* Fallback to SVG shapes when no image is available */
                    <svg
                        viewBox={view === 'frontal' ? '0 0 100 150' : '0 0 100 100'}
                        className="tooth-fallback-svg"
                    >
                        {/* Tooth Body/Root Background */}
                        <g fill={baseColor} stroke={strokeColor} strokeWidth="2">
                            {surfaces.map(surface => (
                                <path
                                    key={surface}
                                    d={getSurfacePath(toothNumber, view, surface)}
                                />
                            ))}
                            {/* Root for frontal view */}
                            {view === 'frontal' && (
                                <path
                                    d={getSurfacePath(toothNumber, view, 'root')}
                                    fill="#F5F5F5"
                                    stroke={strokeColor}
                                />
                            )}
                        </g>

                        {/* Conditions Overlays */}
                        {conditions.map((condition, index) => (
                            <path
                                key={`cond-${index}`}
                                d={getSurfacePath(toothNumber, view, condition.surface)}
                                fill={condition.color || 'transparent'}
                                opacity={condition.opacity || 0.7}
                                stroke={condition.stroke || 'none'}
                                strokeWidth={condition.strokeWidth || 1}
                            />
                        ))}

                        {/* Interactive Layer */}
                        {interactive && surfaces.map(surface => (
                            <path
                                key={`int-${surface}`}
                                d={getSurfacePath(toothNumber, view, surface)}
                                fill="transparent"
                                className="tooth-surface-interactive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSurfaceClick && onSurfaceClick(surface);
                                }}
                            />
                        ))}
                    </svg>
                )}
            </div>
        </div>
    );
};

export default ToothRenderer;
