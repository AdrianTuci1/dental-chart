import React, { useRef, useEffect } from 'react';
import { maskEngine } from './MaskEngine';
import { shouldMirror, getToothImage, mapViewToImageView, getToothCondition, getToothType } from '../../utils/toothUtils';
import { getOverlayPath, getOverlaySlice } from '../../utils/toothOverlayMapping';
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
    const tNum = parseInt(toothNumber, 10);
    const isUpperJaw = (tNum >= 11 && tNum <= 28) || (tNum >= 51 && tNum <= 65);
    const isLower = !isUpperJaw;
    const jawClass = isUpperJaw ? 'upper-jaw' : 'lower-jaw';

    const isMirrored = shouldMirror(toothNumber);
    const type = getToothType(toothNumber);
    const canvasRef = useRef(null);

    const imageView = mapViewToImageView(view, toothNumber);
    const condition = toothData ? getToothCondition(toothData) : 'withRoots';
    const toothImagePath = getToothImage(toothNumber, condition, imageView);
    const imageScale = 0.9;


    // Rotation Logic (Reverted for Lingual based on user feedback)
    // Only Frontal/Buccal Lower Jaw are rotated 180 (Roots Up -> Roots Down).
    const shouldRotateImage = isLower && (view === 'frontal' || view === 'buccal');
    const shouldRotateCanvas = shouldRotateImage;

    // User Logic:
    // Right Side (11-18, 41-48): INSIDE (lingual) -> FLIP.
    // Left Side (21-28, 31-38): OUTSIDE (frontal/buccal) -> FLIP.
    // All others: NO FLIP.
    const isRightSide = (tNum >= 11 && tNum <= 18) || (tNum >= 41 && tNum <= 48);
    const isLeftSide = (tNum >= 21 && tNum <= 28) || (tNum >= 31 && tNum <= 38);

    let shouldMirrorImage = false;
    if (isRightSide && view === 'lingual') shouldMirrorImage = true;
    if (isLeftSide && (view === 'frontal' || view === 'buccal')) shouldMirrorImage = true;

    // Build container transform (incorporating the CSS scale)
    let containerTransformParts = ['scale(1.35)']; // Base scale from CSS
    if (shouldRotateImage) containerTransformParts.push('rotate(180deg)');
    if (shouldMirrorImage) containerTransformParts.push('scaleX(-1)');
    const containerTransform = containerTransformParts.join(' ');

    // Draw conditions on overlay canvas (when image is available)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !toothImagePath) return;

        const ctx = canvas.getContext('2d');
        const width = 100;
        // Logic heights for the CANVAS (display area)
        const height = (view === 'frontal' || view === 'lingual') ? 150 : 100;
        const scale = 2;

        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.resetTransform(); // Clear previous transforms
        ctx.scale(scale, scale);
        ctx.clearRect(0, 0, width, height);

        const drawConditions = async () => {
            if (!conditions || conditions.length === 0) return;

            // Save context for safe restoration
            ctx.save();

            // Load the base tooth image for masking
            let maskImg = null;
            try {
                maskImg = await maskEngine.loadImage(toothImagePath);
            } catch (e) {
                console.warn("Failed to load mask image", e);
            }

            // Offscreen canvas for individual condition coloring
            const offCanvas = document.createElement('canvas');
            offCanvas.width = width * scale;
            offCanvas.height = height * scale;
            const offCtx = offCanvas.getContext('2d');
            offCtx.scale(scale, scale);

            // For each condition, fetch overlay and draw
            for (const cond of conditions) {
                let zoneId = cond.zone;

                // Handle missing zone, map surface
                if (!zoneId && cond.surface) {
                    if (cond.surface === 'Buccal') {
                        zoneId = 'Buccal Surf';
                    } else if (cond.surface === 'Lingual' || cond.surface === 'Palatal') {
                        // Map based on tooth index
                        const index = tNum % 10;
                        if (index >= 1 && index <= 3) {
                            zoneId = 'Palatal Surf';
                        } else {
                            zoneId = 'Lingual Surf';
                        }
                    }
                }

                if (!zoneId) continue; // Skip if no zone ID

                const overlayPath = getOverlayPath(toothNumber, zoneId);
                if (!overlayPath) continue;

                // Determine slice from the SVG file
                const slice = getOverlaySlice(view);

                if (slice.h <= 0) continue;

                try {
                    const img = await maskEngine.loadImage(overlayPath);

                    // Clear offscreen
                    offCtx.clearRect(0, 0, width, height);

                    // 1. Draw the SVG slice
                    offCtx.save();

                    // Logic: Do we still need to flip overlays?
                    // Previous logic: "Always Flip Overlays".
                    // Since we are now operating in "Normal" space (no context flip),
                    // but the CONTAINER is flipped if `shouldMirrorImage` is true, 
                    // we need to decide if overlays start out "backwards" relative to the tooth image or not.
                    // Usually overlays match the base image orientation.
                    // If the base image is drawn normally, and the overlay is drawn normally, they match.
                    // The Container flips BOTH.
                    // HOWEVER, the previous code had:
                    // `offCtx.scale(-1, 1)` (Universal Flip for Overlay) 
                    // AND `if (shouldMirrorImage) ctx.scale(-1, 1)` (Context Flip)
                    //
                    // Case 1: Standard Tooth (No Mirror).
                    // Prev: Context Normal. Overlay Flipped (-1, 1). 
                    // Result: Overlay is flipped relative to standard? 
                    // Why was Overlay Flipped Universally? 
                    // "User Request: 'Contra rotim pe alea care erau bine' (Flip Normal ones)."
                    // This suggests the SVG assets themselves might be mirrored relative to the PNGs?
                    //
                    // Let's preserve the "Universal Overlay Flip" inside offCtx if it exists for asset alignment reasons.
                    // The context flip for `shouldMirrorImage` was REMOVED (now handled by container).
                    // So we only look at the logic inside the loop.

                    offCtx.translate(width, 0);
                    offCtx.scale(-1, 1);

                    if (isUpperJaw && view === 'lingual') {
                        // Flip Vertical to correct Roots Down -> Roots Up mismatch for Upper Jaw
                        offCtx.translate(0, height);
                        offCtx.scale(1, -1);
                    }
                    offCtx.drawImage(
                        img,
                        0, slice.y, img.width, slice.h,
                        0, 0, width, height
                    );
                    offCtx.restore();

                    // 2. Composite Color
                    offCtx.globalCompositeOperation = 'source-in';
                    offCtx.fillStyle = cond.color || 'rgba(100, 150, 255, 0.7)';
                    offCtx.globalAlpha = cond.opacity || 0.7;
                    offCtx.fillRect(0, 0, width, height);

                    // 3. Draw offscreen to main
                    offCtx.globalCompositeOperation = 'source-over';
                    ctx.drawImage(offCanvas, 0, 0, width, height);

                } catch (err) {
                    console.warn(`Failed to load overlay: ${overlayPath}`, err);
                }
            }

            // Apply Masking (Clip to Tooth Shape)
            if (maskImg) {
                ctx.globalCompositeOperation = 'destination-in';
                ctx.drawImage(maskImg, 0, 0, width, height);
                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.restore(); // Restore context
        };

        drawConditions();

    }, [conditions, toothNumber, view, imageView, toothImagePath, tNum, isUpperJaw, shouldMirrorImage]);

    // Handle interactive clicks on canvas
    const handleCanvasClick = async (e) => {
        if (!interactive || !onSurfaceClick) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        console.warn("Detailed zone hit detection is disabled after removing geometry constants.");
        // Optionally pass a generic surface if needed, or do nothing.
    };

    return (
        <div
            className={`tooth-renderer ${jawClass} ${isSelected ? 'selected' : ''} ${className}`}
            style={{
                transform: 'none'
            }}
        >
            <div
                className="tooth-inner"
                style={{
                    transform: containerTransform
                }}
            >
                {toothImagePath ? (
                    <>
                        <img
                            src={toothImagePath}
                            alt={`Tooth ${toothNumber} - ${imageView} view`}
                            className="tooth-image"
                            style={{
                                scale: `${imageScale}`
                            }}
                        />
                        <canvas
                            ref={canvasRef}
                            className="tooth-overlay-canvas"
                            onClick={handleCanvasClick}
                            style={{
                                cursor: interactive ? 'pointer' : 'default',
                                scale: `${imageScale}`
                            }}
                        />
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default ToothRenderer;
