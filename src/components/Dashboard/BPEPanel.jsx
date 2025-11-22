

import React from 'react';
import './BPEPanel.css';

const BPEPanel = ({ data }) => {
    // Map BPE object to array for display order: UR, UA, UL, LR, LA, LL
    // Note: The display grid usually goes:
    // UR (17/16) | UA (11) | UL (26/27)
    // LR (47/46) | LA (31) | LL (36/37)
    // But the object has upperRight, upperAnterior, etc.

    const scores = [
        data?.upperRight || 0,
        data?.upperAnterior || 0,
        data?.upperLeft || 0,
        data?.lowerRight || 0,
        data?.lowerAnterior || 0,
        data?.lowerLeft || 0
    ];

    const getScoreClass = (score) => {
        if (score === '*') return 'bpe-score-3'; // Treat * as high
        const numScore = parseInt(score);
        if (isNaN(numScore)) return 'bpe-score-0';

        if (numScore <= 1) return 'bpe-score-0';
        if (numScore === 2) return 'bpe-score-2';
        return 'bpe-score-3';
    };

    return (
        <div className="bpe-panel">
            <h3 className="bpe-title">Basic Periodontal Examination</h3>
            <div className="bpe-grid">
                {scores.map((score, index) => (
                    <div key={index} className={`bpe-score ${getScoreClass(score)}`}>
                        {score}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BPEPanel;
