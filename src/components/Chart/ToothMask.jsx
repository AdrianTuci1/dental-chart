import React, { useRef, useEffect } from 'react';
import { maskEngine } from './MaskEngine';
import { getOverlayPath, getOverlaySlice } from '../../utils/toothOverlayMapping';
import { getMaskTransforms } from '../../utils/toothMaskTransforms';
import './ToothMask.css';

const ToothMask = ({
    toothNumber,
    view = 'frontal',
    conditions = [],
    interactive = false,
    onCanvasClick,
    toothImagePath,
    imageScale = 0.9
}) => {
    const tNum = parseInt(toothNumber, 10);
    const isUpperJaw = (tNum >= 11 && tNum <= 28) || (tNum >= 51 && tNum <= 65);
    const canvasRef = useRef(null);

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
            // Always clear first, even if no conditions
            ctx.clearRect(0, 0, width, height);

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
                // For lower jaw (31-48), the slice order is inverted:
                // Inside (lingual) is at top, Outside (frontal) is at bottom
                let viewForSlice = view;
                const isLowerJaw = tNum >= 31 && tNum <= 48;
                if (isLowerJaw) {
                    if (view === 'frontal') {
                        viewForSlice = 'lingual'; // Use lingual slice for frontal view
                    } else if (view === 'lingual') {
                        viewForSlice = 'frontal'; // Use frontal slice for lingual view
                    }
                }

                const slice = getOverlaySlice(viewForSlice);

                if (slice.h <= 0) continue;

                try {
                    const img = await maskEngine.loadImage(overlayPath);

                    // Clear offscreen
                    offCtx.clearRect(0, 0, width, height);

                    // 1. Draw the SVG slice with tooth-specific transforms
                    offCtx.save();

                    // Get transforms from configuration
                    const { needsHorizontalFlip, needsRotation } = getMaskTransforms(toothNumber, view);

                    // Apply rotation if needed
                    if (needsRotation) {
                        offCtx.translate(width / 2, height / 2);
                        offCtx.rotate(Math.PI); // 180 degrees
                        offCtx.translate(-width / 2, -height / 2);
                    }

                    // Apply horizontal flip if needed
                    if (needsHorizontalFlip) {
                        offCtx.translate(width, 0);
                        offCtx.scale(-1, 1);
                    }

                    // Always apply vertical flip for upper jaw lingual
                    if (isUpperJaw && view === 'lingual') {
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

    }, [conditions, toothNumber, view, toothImagePath, tNum, isUpperJaw]);

    // Handle interactive clicks on canvas
    const handleCanvasClick = async (e) => {
        if (!interactive || !onCanvasClick) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        console.warn("Detailed zone hit detection is disabled after removing geometry constants.");
        // Optionally pass a generic surface if needed, or do nothing.
    };

    if (!toothImagePath) return null;

    return (
        <canvas
            ref={canvasRef}
            className="tooth-mask-canvas"
            onClick={handleCanvasClick}
            style={{
                cursor: interactive ? 'pointer' : 'default',
                scale: `${imageScale}`
            }}
        />
    );
};

export default ToothMask;
