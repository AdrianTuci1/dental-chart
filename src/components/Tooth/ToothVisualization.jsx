import React, { useEffect, useRef } from 'react';
import ToothRenderer from '../Chart/ToothRenderer';
import './ToothVisualization.css';

const ToothVisualization = ({ toothNumber, conditions, onSelectTooth }) => {
    const currentTooth = parseInt(toothNumber);
    const scrollRef = useRef(null);

    // Generate full list of teeth for the selector
    // Standard order: 18-11, 21-28, 38-31, 41-48
    // But usually lists are 1-32 or FDI. Let's stick to FDI as used in the app.
    // Order in list: 18...11, 21...28, 48...41, 31...38? 
    // Or just numerical order? The image usually shows a vertical strip.
    // Let's do a simple numerical sort for now or quadrant based.
    // Let's use the standard FDI list order often used in dropdowns:
    // Q1: 18-11, Q2: 21-28, Q3: 38-31, Q4: 41-48? 
    // Actually, usually it's 18-11, 21-28 (Upper) then 48-41, 31-38 (Lower).
    // Let's just list them all.
    const allTeeth = [
        18, 17, 16, 15, 14, 13, 12, 11,
        21, 22, 23, 24, 25, 26, 27, 28,
        38, 37, 36, 35, 34, 33, 32, 31,
        41, 42, 43, 44, 45, 46, 47, 48
    ].sort((a, b) => a - b); // Simple sort for the list: 11..18, 21..28, etc.

    // Auto-scroll to selected tooth
    useEffect(() => {
        if (scrollRef.current) {
            const activeItem = scrollRef.current.querySelector('.tooth-number-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [toothNumber]);

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

            {/* Visualization Column */}
            <div className="visualization-column">
                {/* 
                    To create a "carousel" effect, we could render the previous/next teeth too, 
                    but for now, let's just animate the current one.
                    Actually, the user asked for the "teeth-column" to be a vertical carousel.
                    We can simulate this by just having the content.
                */}
                <div className="tooth-slide">
                    {/* Top View (Buccal/Frontal) */}
                    <div className="tooth-view-wrapper top">
                        <div className="gum-line"></div>
                        <div className="gum-zone"></div>
                        <ToothRenderer
                            toothNumber={toothNumber}
                            view="frontal"
                            conditions={conditions}
                        />
                    </div>

                    {/* Middle View (Occlusal) */}
                    <div className="tooth-view-wrapper middle">
                        <ToothRenderer
                            toothNumber={toothNumber}
                            view="topview"
                            conditions={conditions}
                        />
                    </div>

                    {/* Bottom View (Lingual) */}
                    <div className="tooth-view-wrapper bottom">
                        <div className="gum-line"></div>
                        <div className="gum-zone"></div>
                        <ToothRenderer
                            toothNumber={toothNumber}
                            view="lingual"
                            conditions={conditions}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToothVisualization;
