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


    // Draw conditions on overlay canvas (when image is available)
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

            // Load the base tooth image for masking
            let maskImg = null;
            try {
                maskImg = await maskEngine.loadImage(toothImagePath);
            } catch (e) {
                console.warn("Failed to load mask image", e);
                // Continue without masking if failed, or abort? 
                // Aborting might mean unclipped overlays, which is better than nothing?
                // But user complained about masking not working.
            }

            // Offscreen canvas for individual condition coloring
            const offCanvas = document.createElement('canvas');
            offCanvas.width = width * scale;
            offCanvas.height = height * scale;
            const offCtx = offCanvas.getContext('2d');
            offCtx.scale(scale, scale);

            // For each condition, fetch overlay and draw
            for (const cond of conditions) {
                if (!cond.zone) continue; // Skip if no zone ID

                const overlayPath = getOverlayPath(toothNumber, cond.zone);
                if (!overlayPath) continue;

                // Determine slice from the SVG file
                const slice = getOverlaySlice(view); // { y, h } (and h is source height)

                // If slice.h is 0, this view isn't supported for overlays?
                if (slice.h <= 0) continue;

                try {
                    const img = await maskEngine.loadImage(overlayPath);

                    // Clear offscreen
                    offCtx.clearRect(0, 0, width, height);

                    // 1. Draw the SVG slice
                    // Source: SVG is 54px wide according to user. Slice defined in mapping.
                    // Dest: Canvas is 100px wide. Stretch to fit.
                    offCtx.save();
                    if (isUpperJaw && view === 'lingual') {
                        // Flip Vertical to correct Roots Down -> Roots Up mismatch for Upper Jaw
                        offCtx.translate(0, height);
                        offCtx.scale(1, -1);
                    }
                    offCtx.drawImage(
                        img,
                        0, slice.y, img.width, slice.h, // Source (Uses actual img width, likely 54)
                        0, 0, width, height      // Dest
                    );
                    offCtx.restore();

                    // 2. Composite Color
                    offCtx.globalCompositeOperation = 'source-in';
                    offCtx.fillStyle = cond.color || 'rgba(100, 150, 255, 0.7)';
                    offCtx.globalAlpha = cond.opacity || 0.7;
                    offCtx.fillRect(0, 0, width, height);

                    // 3. Draw offscreen to main
                    offCtx.globalCompositeOperation = 'source-over'; // Reset for next use
                    ctx.drawImage(offCanvas, 0, 0, width, height);

                } catch (err) {
                    console.warn(`Failed to load overlay: ${overlayPath}`, err);
                }
            }

            // Apply Masking (Clip to Tooth Shape)
            // Apply Masking (Clip to Tooth Shape)
            if (maskImg) {
                ctx.globalCompositeOperation = 'destination-in';
                ctx.drawImage(maskImg, 0, 0, width, height);
                ctx.globalCompositeOperation = 'source-over';
            }
        };

        drawConditions();

    }, [conditions, toothNumber, view, imageView, toothImagePath]);



    // Handle interactive clicks on canvas
    const handleCanvasClick = async (e) => {
        if (!interactive || !onSurfaceClick) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Simplified hit detection for now:
        // Since we removed geometric paths, we can't easily detect specific zones (M, D, B, L).
        // For now, we consider a click on the tooth "surface" generally?
        // Or disable interaction.
        // User requested removing constants, which entails removing geometric hit detection.
        // So we disable detailed zone clicking for now.
        console.warn("Detailed zone hit detection is disabled after removing geometry constants.");

        // Optionally pass a generic surface if needed, or do nothing.
        // onSurfaceClick('surface'); 
    };

    let imageScale = 0.9;

    // Rotation Logic (Reverted for Lingual based on user feedback)
    // Only Frontal/Buccal Lower Jaw are rotated 180 (Roots Up -> Roots Down).
    // Lingual/Inside for Lower Jaw seems to stay Roots Up (Standard Orientation)?
    const shouldRotateImage = isLower && (view === 'frontal' || view === 'buccal');
    const shouldRotateCanvas = shouldRotateImage;

    const imageRotation = shouldRotateImage ? 'rotate(180deg)' : 'none';
    const canvasRotation = shouldRotateCanvas ? 'rotate(180deg)' : 'none';

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
                                transform: canvasRotation
                            }}
                        />
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default ToothRenderer;
