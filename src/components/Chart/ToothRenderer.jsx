
import { getSurfacePath, getToothType } from '../../utils/svgPaths';
import { shouldMirror, getToothImage, mapViewToImageView, getToothCondition } from '../../utils/toothUtils';

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

    return (
        <div
            className={`relative inline-block transition-transform ${isSelected ? 'scale-110 z-10' : ''}`}
            style={{
                width: '100%',
                height: 'auto',
                transform: isMirrored ? 'scaleX(-1)' : 'none'
            }}
        >
            {/* Display tooth image if available, otherwise use SVG */}
            {toothImagePath ? (
                <>
                    {/* Tooth Image */}
                    <img
                        src={toothImagePath}
                        alt={`Tooth ${toothNumber} - ${imageView} view`}
                        className="absolute top-0 left-0 w-full h-full object-contain drop-shadow-sm"
                        style={{
                            pointerEvents: 'none'
                        }}
                    />

                    {/* SVG overlay for conditions and interactions */}
                    <svg
                        viewBox={view === 'frontal' ? '0 0 100 150' : '0 0 100 100'}
                        className="absolute top-0 left-0 w-full h-full z-10"
                        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
                    >
                        {/* Conditions Overlays */}
                        {conditions.map((condition, index) => (
                            <path
                                key={`cond-${index}`}
                                d={getSurfacePath(toothNumber, view, condition.surface)}
                                fill={condition.color || 'transparent'}
                                opacity={condition.opacity || 0.7}
                                stroke={condition.stroke || 'none'}
                                strokeWidth={condition.strokeWidth || 1}
                                style={{ pointerEvents: 'none' }}
                            />
                        ))}

                        {/* Interactive Layer */}
                        {interactive && surfaces.map(surface => (
                            <path
                                key={`int-${surface}`}
                                d={getSurfacePath(toothNumber, view, surface)}
                                fill="transparent"
                                className="cursor-pointer hover:fill-blue-400/30 transition-colors"
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
                    className="absolute top-0 left-0 w-full h-full drop-shadow-sm"
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
                            className="cursor-pointer hover:fill-blue-400/30 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSurfaceClick && onSurfaceClick(surface);
                            }}
                        />
                    ))}
                </svg>
            )}

        </div>
    );
};

export default ToothRenderer;
