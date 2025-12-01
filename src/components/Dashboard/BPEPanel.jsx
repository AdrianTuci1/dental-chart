
import React from 'react';
import './BPEPanel.css';

const SextantBox = ({ label, score }) => {
    const displayScore = score !== undefined && score !== null ? score : 'N/A';

    return (
        <div className="sextant-box">
            <div className="sextant-score-container">
                <div className="sextant-line"></div>
                <div className="sextant-circle">
                    <span className="sextant-value">{displayScore}</span>
                </div>
                <div className="sextant-line"></div>
            </div>
            <div className="sextant-label">{label}</div>
        </div>
    );
};

const BPEPanel = ({ data }) => {
    // Data mapping
    const sextants = [
        { label: 'Upper right', score: data?.upperRight },
        { label: 'Upper anterior', score: data?.upperAnterior },
        { label: 'Upper left', score: data?.upperLeft },
        { label: 'Lower right', score: data?.lowerRight },
        { label: 'Lower anterior', score: data?.lowerAnterior },
        { label: 'Lower left', score: data?.lowerLeft }
    ];

    return (
        <div className="bpe-panel">
            <div className="bpe-grid">
                {sextants.map((sextant, index) => (
                    <SextantBox
                        key={index}
                        label={sextant.label}
                        score={sextant.score}
                    />
                ))}
            </div>
        </div>
    );
};

export default BPEPanel;
