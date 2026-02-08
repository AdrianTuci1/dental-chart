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
            if (!conditions || conditions.length === 0) {
                ctx.clearRect(0, 0, width, height);
                return;
            }

            // 1. Prepare all overlay data first (paths, slices)
            const overlayData = conditions.map(cond => {
                let zoneId = cond.zone;
                if (!zoneId && cond.surface) {
                    if (cond.surface === 'Buccal') {
                        zoneId = 'Buccal Surf';
                    } else if (cond.surface === 'Lingual' || cond.surface === 'Palatal') {
                        const index = tNum % 10;
                        if (index >= 1 && index <= 3) {
                            zoneId = 'Palatal Surf';
                        } else {
                            zoneId = 'Lingual Surf';
                        }
                    }
                }

                if (!zoneId) return null;

                const overlayPath = getOverlayPath(toothNumber, zoneId);
                if (!overlayPath) return null;

                let viewForSlice = view;
                const isLowerJaw = tNum >= 31 && tNum <= 48;
                if (isLowerJaw) {
                    if (view === 'frontal') {
                        viewForSlice = 'lingual';
                    } else if (view === 'lingual') {
                        viewForSlice = 'frontal';
                    }
                }

                const slice = getOverlaySlice(viewForSlice);
                if (slice.h <= 0) return null;

                return { cond, overlayPath, slice };
            }).filter(Boolean);

            // 2. Preload ALL images (mask and overlays)
            const preloadPromises = [
                maskEngine.loadImage(toothImagePath).catch(() => null),
                ...overlayData.map(data => maskEngine.loadImage(data.overlayPath).catch(() => null))
            ];

            const [maskImg, ...loadedOverlayImages] = await Promise.all(preloadPromises);

            // 3. Clear and Draw
            ctx.clearRect(0, 0, width, height);
            ctx.save();

            // Offscreen canvas for individual condition coloring
            const offCanvas = document.createElement('canvas');
            offCanvas.width = width * scale;
            offCanvas.height = height * scale;
            const offCtx = offCanvas.getContext('2d');
            offCtx.scale(scale, scale);

            overlayData.forEach((data, index) => {
                const img = loadedOverlayImages[index];
                if (!img) return;

                const { cond, slice } = data;

                offCtx.clearRect(0, 0, width, height);
                offCtx.save();

                const { needsHorizontalFlip, needsRotation } = getMaskTransforms(toothNumber, view);

                if (needsRotation) {
                    offCtx.translate(width / 2, height / 2);
                    offCtx.rotate(Math.PI);
                    offCtx.translate(-width / 2, -height / 2);
                }

                if (needsHorizontalFlip) {
                    offCtx.translate(width, 0);
                    offCtx.scale(-1, 1);
                }

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

                offCtx.globalCompositeOperation = 'source-in';
                offCtx.fillStyle = cond.color || 'rgba(100, 150, 255, 0.7)';
                offCtx.globalAlpha = cond.opacity || 0.7;
                offCtx.fillRect(0, 0, width, height);

                offCtx.globalCompositeOperation = 'source-over';
                ctx.drawImage(offCanvas, 0, 0, width, height);
            });

            // 4. Apply Masking
            if (maskImg) {
                ctx.globalCompositeOperation = 'destination-in';
                ctx.drawImage(maskImg, 0, 0, width, height);
                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.restore();
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
