import React from 'react';
import { getSurfacePath, getToothType } from '../../utils/svgPaths';
import { shouldMirror } from '../../utils/toothUtils';

const ToothRenderer = ({
    toothNumber,
    view = 'frontal',
    conditions = [],
    interactive = false,
    onSurfaceClick,
    isSelected = false
}) => {
    const isMirrored = shouldMirror(toothNumber);
    const type = getToothType(toothNumber);

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
                width: '60px',
                height: view === 'frontal' ? '90px' : '60px',
                transform: isMirrored ? 'scaleX(-1)' : 'none'
            }}
        >
            {/* Placeholder for Base Image - using SVG shape instead */}
            <svg
                viewBox={view === 'frontal' ? '0 0 100 200' : '0 0 100 100'}
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
                            e.stopPropagation(); // Prevent triggering parent click
                            onSurfaceClick && onSurfaceClick(surface);
                        }}
                    />
                ))}
            </svg>

        </div>
    );
};

export default ToothRenderer;
