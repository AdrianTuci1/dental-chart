import React from 'react';
import { shouldMirror, getToothImage, mapViewToImageView, getToothCondition, getToothType } from '../../utils/toothUtils';
import ToothMask from './ToothMask';
import './ToothRenderer.css';

const ToothRenderer = ({
    toothNumber,
    view = 'frontal',
    conditions = [],
    interactive = false,
    onSurfaceClick,
    isSelected = false,
    toothData = null,
    className = '',
    historicalDate = null
}) => {
    const tNum = parseInt(toothNumber, 10);
    const isUpperJaw = (tNum >= 11 && tNum <= 28) || (tNum >= 51 && tNum <= 65);
    const isLower = !isUpperJaw;
    const jawClass = isUpperJaw ? 'upper-jaw' : 'lower-jaw';

    const isMirrored = shouldMirror(toothNumber);
    const type = getToothType(toothNumber);

    const imageView = mapViewToImageView(view, toothNumber);
    const condition = toothData ? getToothCondition(toothData, historicalDate) : 'withRoots';
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
    if (isLeftSide && (view === 'frontal' || view === 'buccal' || view === 'topview')) shouldMirrorImage = true;

    // Build container transform (incorporating the CSS scale)
    const baseScale = 1.35; // Base scale from CSS
    let containerTransformParts = [`scale(${baseScale})`];
    if (shouldRotateImage) containerTransformParts.push('rotate(180deg)');
    if (shouldMirrorImage) containerTransformParts.push('scaleX(-1)');
    const containerTransform = containerTransformParts.join(' ');



    // Handle interactive clicks on canvas
    const handleCanvasClick = async (e) => {
        if (!interactive || !onSurfaceClick) return;

        console.warn("Detailed zone hit detection is disabled after removing geometry constants.");
        // Optionally pass a generic surface if needed, or do nothing.
    };

    return (
        <div
            className={`tooth-renderer ${jawClass} ${isSelected ? 'selected' : ''} ${className}`}
            style={{
                transform: 'none',
                position: 'relative'
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
                        <ToothMask
                            toothNumber={toothNumber}
                            view={view}
                            conditions={conditions}
                            interactive={interactive}
                            onCanvasClick={handleCanvasClick}
                            toothImagePath={toothImagePath}
                            imageScale={imageScale}
                        />
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default ToothRenderer;
