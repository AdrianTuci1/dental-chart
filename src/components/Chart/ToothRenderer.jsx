import { getToothImage, mapViewToImageView, getToothCondition, isUpperJaw as checkIsUpperJaw } from '../../utils/toothUtils';
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
    const isUpperJaw = checkIsUpperJaw(tNum);
    const isLower = !isUpperJaw;
    const jawClass = isUpperJaw ? 'upper-jaw' : 'lower-jaw';

    const imageView = mapViewToImageView(view, toothNumber);
    const condition = toothData ? getToothCondition(toothData, historicalDate) : 'withRoots';
    const isNotYetDeveloped = condition === 'notYetDeveloped';
    const toothImagePath = isNotYetDeveloped ? null : getToothImage(toothNumber, condition, imageView);

    // For the overlay mask, we need a shape that includes the coronal part.
    // If the tooth relies on an implant image, the implant image itself doesn't have a crown shape
    // to mask against, so the fillings get clipped out. We use the 'crown' shape for masks on implants/pontics,
    // or 'withRoots' for standard/missing.
    let maskCondition = condition;
    if (condition === 'implant' || condition === 'crown') maskCondition = 'withRoots';
    if (condition === 'missing') maskCondition = 'withRoots'; // Allow drawing on empty space if needed

    const maskImagePath = getToothImage(toothNumber, maskCondition, imageView);
    const imageScale = 0.9;


    // Rotation Logic (Reverted for Lingual based on user feedback)
    // Only Frontal/Buccal Lower Jaw are rotated 180 (Roots Up -> Roots Down).
    const shouldRotateImage = isLower && (view === 'frontal' || view === 'buccal');

    // User Logic:
    // Right Side (11-18, 41-48): INSIDE (lingual) -> FLIP.
    // Left Side (21-28, 31-38): OUTSIDE (frontal/buccal) -> FLIP.
    // All others: NO FLIP.
    const isRightSide = (tNum >= 11 && tNum <= 18) || (tNum >= 41 && tNum <= 48) || (tNum >= 51 && tNum <= 55) || (tNum >= 81 && tNum <= 85);
    const isLeftSide = (tNum >= 21 && tNum <= 28) || (tNum >= 31 && tNum <= 38) || (tNum >= 61 && tNum <= 65) || (tNum >= 71 && tNum <= 75);

    let shouldMirrorImage = false;
    if (isRightSide && view === 'lingual') shouldMirrorImage = true;
    if (isLeftSide && (view === 'frontal' || view === 'buccal' || view === 'topview')) shouldMirrorImage = true;

    // Build container transform (incorporating the CSS scale)
    const isDeciduous = tNum >= 51 && tNum <= 85;
    const baseScale = isDeciduous ? 1.35 * 0.85 : 1.35; // Base scale from CSS, reduced for baby teeth
    let containerTransformParts = [`scale(${baseScale})`];
    if (shouldRotateImage) containerTransformParts.push('rotate(180deg)');
    if (shouldMirrorImage) containerTransformParts.push('scaleX(-1)');
    const containerTransform = containerTransformParts.join(' ');



    // Handle interactive clicks on canvas
    const handleCanvasClick = async () => {
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
                {isNotYetDeveloped ? (
                    <>
                        <img
                            src={getToothImage(toothNumber, 'missing', imageView)}
                            className="tooth-image"
                            style={{
                                visibility: 'hidden',
                                scale: `${imageScale}`
                            }}
                            alt="spacer"
                        />
                    </>
                ) : toothImagePath ? (
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
                            toothImagePath={maskImagePath}
                            imageScale={imageScale}
                        />
                    </>
                ) : null}
            </div>
            {isNotYetDeveloped && (
                <div className="not-developed-wrapper">
                    <div className="not-developed-marker">
                        <span className="not-developed-line" />
                        <span className="not-developed-circle" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToothRenderer;
