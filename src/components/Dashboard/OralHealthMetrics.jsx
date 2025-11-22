import React from 'react';

import './OralHealthMetrics.css';

import './OralHealthMetrics.css';

const OralHealthMetrics = ({ data }) => {
    // Default values if data is missing
    const plaqueIndex = data?.plaqueIndex || 0;
    const bleedingIndex = data?.bleedingIndex || 0;

    // Helper to determine risk level (mock logic)
    const getRiskLevel = (value) => {
        if (value < 10) return { label: 'Low Risk', color: 'blue' };
        if (value < 30) return { label: 'Moderate Risk', color: 'red' }; // Using red for moderate to match design
        return { label: 'High Risk', color: 'red' };
    };

    const plaqueRisk = getRiskLevel(plaqueIndex);
    const bleedingRisk = getRiskLevel(bleedingIndex);

    return (
        <div className="oral-health-metrics">
            <h3 className="metrics-title">Oral Health Metrics</h3>

            <div className="metrics-grid">
                <div className={`metric-card ${plaqueRisk.color === 'blue' ? 'blue' : 'red'}`}>
                    <p className="metric-label">Plaque Index</p>
                    <p className={`metric-value ${plaqueRisk.color === 'blue' ? 'blue' : 'red'}`}>{plaqueIndex}%</p>
                    <p className={`metric-status ${plaqueRisk.color === 'blue' ? 'blue' : 'red'}`}>{plaqueRisk.label}</p>
                </div>

                <div className={`metric-card ${bleedingRisk.color === 'blue' ? 'blue' : 'red'}`}>
                    <p className="metric-label">Bleeding Index</p>
                    <p className={`metric-value ${bleedingRisk.color === 'blue' ? 'blue' : 'red'}`}>{bleedingIndex}%</p>
                    <p className={`metric-status ${bleedingRisk.color === 'blue' ? 'blue' : 'red'}`}>{bleedingRisk.label}</p>
                </div>
            </div>
        </div>
    );
};

export default OralHealthMetrics;
