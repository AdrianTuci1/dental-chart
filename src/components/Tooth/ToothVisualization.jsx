import React, { useEffect, useRef } from 'react';
import ToothRenderer from '../Chart/ToothRenderer';
import '../Chart/ChartOverview.css';
import './ToothVisualization.css';

const ToothVisualization = ({ toothNumber, conditions, onSelectTooth }) => {
    const currentTooth = parseInt(toothNumber);
    const scrollRef = useRef(null);

    // Generate full list of teeth for the selector
    // Standard FDI order: Q1 (18-11), Q2 (21-28), Q3 (38-31), Q4 (41-48)
    const allTeeth = [
        18, 17, 16, 15, 14, 13, 12, 11,
        21, 22, 23, 24, 25, 26, 27, 28,
        38, 37, 36, 35, 34, 33, 32, 31,
        41, 42, 43, 44, 45, 46, 47, 48
    ].sort((a, b) => a - b);

    // Auto-scroll to selected tooth
    useEffect(() => {
        if (scrollRef.current) {
            const activeItem = scrollRef.current.querySelector('.tooth-number-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [toothNumber]);

    // Determine if tooth is in upper or lower jaw
    const isUpperJaw = currentTooth >= 11 && currentTooth <= 28;

    // Define views based on jaw position (same as UpperJawView/LowerJawView)
    const views = isUpperJaw
        ? ['frontal', 'topview', 'lingual']  // Upper jaw order
        : ['lingual', 'topview', 'frontal']; // Lower jaw order

    const dataView = isUpperJaw ? 'upper-jaw' : 'lower-jaw';

    return (
        <div className="tooth-visualization-container">
            {/* Left Tooth Selector */}
            <div className="tooth-selector-column" ref={scrollRef}>
                {allTeeth.map((num) => (
                    <div
                        key={num}
                        className={`tooth-number-item ${num === currentTooth ? 'active' : ''}`}
                        onClick={() => onSelectTooth(num)}
                    >
                        {num}
                    </div>
                ))}
            </div>

            {/* Visualization Column - uses exact jaw view structure */}
            <div className="visualization-column" data-view={dataView}>
                <div className="jaw-box">
                    <ol className="jaw" data-type={isUpperJaw ? 'upper' : 'lower'}>
                        <li className="tooth" data-number={currentTooth}>
                            {views.map((view) => {
                                const isBuccal = view === 'frontal';
                                const isLingual = view === 'lingual';

                                return (
                                    <div
                                        key={view}
                                        className={`trigger visualization ${isBuccal ? 'view-buccal' : isLingual ? 'view-lingual' : 'view-occlusal'}`}
                                    >
                                        <ToothRenderer
                                            toothNumber={toothNumber}
                                            view={view}
                                            conditions={conditions}
                                            interactive={false}
                                        />
                                    </div>
                                );
                            })}
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default ToothVisualization;
