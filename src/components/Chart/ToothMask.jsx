import React, { useRef, useEffect } from 'react';
import { maskEngine } from './MaskEngine';
import { getOverlayPath, getOverlaySlice } from '../../utils/toothOverlayMapping';
import { getMaskTransforms } from '../../utils/toothMaskTransforms';
import { getEndoTransforms } from '../../utils/endoUtils';
import { getApicalCoordinates } from '../../utils/apicalConfig';
import { isUpperJaw as checkIsUpperJaw } from '../../utils/toothUtils';
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
    // Apical Circle Configuration
    const APICAL_RADIUS = 4;
    const APICAL_LINE_WIDTH = 1;

    const tNum = parseInt(toothNumber, 10);
    const isUpperJaw = checkIsUpperJaw(tNum);
    const canvasRef = useRef(null);

    // Draw conditions on overlay canvas (when image is available)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !toothImagePath) return;

        const ctx = canvas.getContext('2d');
        const width = 54;
        // Logic heights for the CANVAS (display area) matching SVG viewboxes
        const height = (view === 'frontal' || view === 'lingual') ? 172 : 94;
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
                    // Fallbacks if cond.zone is missing but cond.surface has exact strings
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

                // If cond.zone is present, it might be the Enum like 'Lingual' or 'Palatal' or 'Buccal'.
                // SVG mapping requires 'Lingual Surf', 'Palatal Surf', 'Buccal Surf'
                if (zoneId === 'Lingual') zoneId = 'Lingual Surf';
                if (zoneId === 'Palatal') zoneId = 'Palatal Surf';
                if (zoneId === 'Buccal') zoneId = 'Buccal Surf';

                if (!zoneId) return null;

                let overlayPath = null;
                let slice = { y: 0, h: height }; // default full height for Whole Tooth

                if (zoneId !== 'Whole Tooth') {
                    overlayPath = getOverlayPath(toothNumber, zoneId, view);
                    if (!overlayPath) return null;

                    let viewForSlice = view;
                    const isLowerJaw = !isUpperJaw;
                    if (isLowerJaw) {
                        if (view === 'frontal') {
                            viewForSlice = 'lingual';
                        } else if (view === 'lingual') {
                            viewForSlice = 'frontal';
                        }
                    }

                    slice = getOverlaySlice(viewForSlice, zoneId);
                    if (slice.h <= 0) return null;
                }

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

            // Group conditions by color+opacity so same-color masks merge without
            // darkening at overlap (source-atop keeps max coverage, not additive).
            const colorGroups = new Map();
            overlayData.forEach((data, index) => {
                const img = loadedOverlayImages[index];
                if (data.cond.zone !== 'Whole Tooth' && !img) return;
                const color = data.cond.color || 'rgba(100, 150, 255, 0.9)';
                const opacity = data.cond.opacity !== undefined ? data.cond.opacity : 0.9;
                const type = data.cond.type || 'unknown';
                const key = `${color}|${opacity}|${type}`;
                if (!colorGroups.has(key)) colorGroups.set(key, []);
                colorGroups.get(key).push({ ...data, img });
            });

            colorGroups.forEach((group, key) => {
                const [color, opacityStr, type] = key.split('|');
                // Shared per-group canvas — merges all shapes of the same color
                const groupCanvas = document.createElement('canvas');
                groupCanvas.width = width * scale;
                groupCanvas.height = height * scale;
                const groupCtx = groupCanvas.getContext('2d');
                groupCtx.scale(scale, scale);

                group.forEach(({ cond, slice, img }) => {
                    offCtx.clearRect(0, 0, width, height);
                    offCtx.save();

                    if (cond.zone === 'Whole Tooth') {
                        // For whole tooth, just fill the entire canvas
                        offCtx.fillStyle = cond.color || 'rgba(100, 150, 255, 0.9)';
                        offCtx.fillRect(0, 0, width, height);
                    } else {
                        const { needsHorizontalFlip, needsRotation } = getMaskTransforms(toothNumber, view);

                        let useHorizontalFlip = needsHorizontalFlip;
                        let useVerticalFlip = (isUpperJaw && view === 'lingual');
                        let useRotation = needsRotation;

                        if (cond.zone === 'Endo') {
                            const endoTransforms = getEndoTransforms(toothNumber, view, { needsHorizontalFlip, needsRotation });
                            useHorizontalFlip = endoTransforms.useHorizontalFlip;
                            useVerticalFlip = endoTransforms.useVerticalFlip;
                            useRotation = endoTransforms.useRotation;
                        }

                        if (useRotation) {
                            offCtx.translate(width / 2, height / 2);
                            offCtx.rotate(Math.PI);
                            offCtx.translate(-width / 2, -height / 2);
                        }
                        if (useHorizontalFlip) {
                            offCtx.translate(width, 0);
                            offCtx.scale(-1, 1);
                        }
                        if (useVerticalFlip) {
                            offCtx.translate(0, height);
                            offCtx.scale(1, -1);
                        }

                        offCtx.drawImage(
                            img,
                            0, slice.y, img.width, slice.h,
                            0, 0, width, height
                        );
                        offCtx.restore();

                        // Color the shape
                        offCtx.globalCompositeOperation = 'source-in';
                        offCtx.fillStyle = cond.color || 'rgba(100, 150, 255, 0.9)';
                        offCtx.globalAlpha = 1; // opacity handled at group composite step
                        offCtx.fillRect(0, 0, width, height);
                    }
                    offCtx.globalCompositeOperation = 'source-over';

                    // Merge into group canvas: source-atop prevents overlap darkening
                    // for identical colors; union of shapes is drawn at uniform color.
                    groupCtx.globalCompositeOperation = 'source-over';
                    groupCtx.drawImage(offCanvas, 0, 0, width, height);
                });

                // Composite the group onto main ctx at the group opacity
                ctx.globalAlpha = parseFloat(opacityStr);

                // If this is a restoration, clear the area underneath it first
                // so pathology colors don't bleed through
                if (type === 'restoration') {
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.drawImage(groupCanvas, 0, 0, width, height);
                }

                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(groupCanvas, 0, 0, width, height);
                ctx.globalAlpha = 1;
            });

            // 4. Apply Masking (Destination-in clips condition layers to tooth alpha)
            if (maskImg) {
                ctx.globalCompositeOperation = 'destination-in';
                ctx.drawImage(maskImg, 0, 0, width, height);
                ctx.globalCompositeOperation = 'source-over';
            }

            // 5. Draw Apical Circles (AFTER masking)
            // Skip for topview
            if (view !== 'topview') {
                const apicalCondition = conditions.find(c => c.type === 'apical');
                if (apicalCondition) {
                    ctx.save();
                    ctx.strokeStyle = apicalCondition.color || '#EF4444';
                    ctx.lineWidth = APICAL_LINE_WIDTH;
                    ctx.globalAlpha = apicalCondition.opacity || 1.0;

                    const baseCoords = getApicalCoordinates(toothNumber);

                    const LOGICAL_W = 54;
                    const LOGICAL_H = 172;
                    const BOX_W = 48;
                    const BOX_H = 160;

                    const boxOffsetX = (LOGICAL_W - BOX_W) / 2; // 3
                    const boxOffsetY = (LOGICAL_H - BOX_H) / 2; // 6

                    baseCoords.forEach(coord => {
                        let drawX = coord.x;
                        let drawY = coord.y;


                        // Map to logical/canvas space (1:1 mapping now)
                        let finalX = boxOffsetX + drawX;
                        let finalY = boxOffsetY + drawY;

                        ctx.beginPath();
                        ctx.arc(finalX, finalY, APICAL_RADIUS, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                    ctx.restore();
                }
            }

            ctx.restore();
        };

        drawConditions();

    }, [conditions, toothNumber, view, toothImagePath, tNum, isUpperJaw]);

    // Handle interactive clicks on canvas
    const handleCanvasClick = async () => {
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
