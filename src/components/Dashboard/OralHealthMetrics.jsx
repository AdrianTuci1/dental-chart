import React from 'react';
import './OralHealthMetrics.css';

const OralHealthMetrics = ({ data }) => {
    // Default values
    const plaqueIndex = data?.plaqueIndex || 0;
    const bleedingIndex = data?.bleedingIndex || 0;
    // Mock halitosis value for visual if not present, or use a default
    const halitosisValue = data?.halitosis || 2; // 1-5 scale? Or just visual. Design shows a segmented bar.

    return (
        <div className="oral-health-metrics">
            {/* Plaque Index */}
            <div className="metric-row">
                <div className="metric-header-row">
                    <span className="metric-label">PLAQUE INDEX</span>
                    <span className="metric-value">{plaqueIndex}%</span>
                </div>
                <div className="progress-bar-container">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${plaqueIndex}%`, backgroundColor: '#e0e0e0' }} // Grey base
                    >
                        <div className="progress-fill-active" style={{ width: '100%', backgroundColor: '#d1d5db' }}></div>
                    </div>
                    {/* The design shows a specific style: grey background line, and a fill. 
                        Actually, looking closer at the image:
                        Plaque Index: Grey bar, filled portion is slightly darker grey? Or maybe it's just a simple bar.
                        Wait, the image shows:
                        PLAQUE INDEX         17%
                        [====================] (Light grey bar, with a darker grey fill for the 17%)
                        
                        BLEEDING INDEX       17%
                        [====================] (Light grey bar, with a green fill? No, it looks like a light green or grey fill)
                        
                        HALITOSIS
                        [=][=][ ][ ][ ] (Segmented green blocks)
                    */}
                    <div className="simple-progress-bg">
                        <div className="simple-progress-fill" style={{ width: `${plaqueIndex}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Bleeding Index */}
            <div className="metric-row">
                <div className="metric-header-row">
                    <span className="metric-label">BLEEDING INDEX</span>
                    <span className="metric-value">{bleedingIndex}%</span>
                </div>
                <div className="simple-progress-bg">
                    <div className="simple-progress-fill" style={{ width: `${bleedingIndex}%` }}></div>
                </div>
            </div>

            {/* Halitosis */}
            <div className="metric-row">
                <div className="metric-header-row">
                    <span className="metric-label">HALITOSIS</span>
                </div>
                <div className="segmented-progress">
                    {[1, 2, 3, 4, 5].map((level) => (
                        <div
                            key={level}
                            className={`segment ${level <= halitosisValue ? 'filled' : ''}`}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OralHealthMetrics;
