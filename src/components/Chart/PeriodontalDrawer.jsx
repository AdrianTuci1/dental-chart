import React, { useState } from 'react';
import './PeriodontalDrawer.css';

const PeriodontalDrawer = ({ toothNumber, position = 'right', onClose, onNext, onPrevious }) => {
    const [activeTab, setActiveTab] = useState('probing'); // 'probing' or 'gingival'
    const [selectedSite, setSelectedSite] = useState('distoPalatal');

    const sites = [
        { id: 'distoPalatal', label: 'Disto Palatal', val: 1 },
        { id: 'palatal', label: 'Palatal', val: 3 },
        { id: 'mesioPalatal', label: 'Mesio Palatal', val: 1, indicators: ['red', 'blue'] },
        { id: 'distoBuccal', label: 'Disto Buccal', val: 1, indicators: ['red', 'blue'] },
        { id: 'buccal', label: 'Buccal', val: 1 },
        { id: 'mesioBuccal', label: 'Mesio Buccal', val: 1 }
    ];

    const numpadValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, '>12'];

    return (
        <div className={`periodontal-drawer ${position}`}>
            <div className="drawer-header">
                <div className="drawer-nav">
                    <span className="nav-arrow" onClick={onPrevious}>&lt;</span>
                    <span className="nav-arrow" onClick={onNext}>&gt;</span>
                </div>
                <div className="tooth-title">TOOTH {toothNumber}</div>
                <div className="drawer-actions">
                    <span className="action-icon">🔇</span>
                    <span className="action-icon" onClick={onClose}>✕</span>
                </div>
            </div>

            <div className="probing-grid">
                {sites.map(site => (
                    <div
                        key={site.id}
                        className={`probing-cell ${selectedSite === site.id ? 'active' : ''}`}
                        onClick={() => setSelectedSite(site.id)}
                    >
                        <div className="probing-value">{site.val}</div>
                        <div className="probing-label">{site.label}</div>
                        {site.indicators && (
                            <div className="indicators">
                                {site.indicators.map((color, i) => (
                                    <div key={i} className={`indicator-dot ${color}`}></div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="measurement-tabs">
                <div
                    className={`tab ${activeTab === 'probing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('probing')}
                >
                    PROBING DEPTH
                </div>
                <div
                    className={`tab ${activeTab === 'gingival' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gingival')}
                >
                    GINGIVAL MARGIN
                </div>
            </div>

            <div className="numpad">
                {numpadValues.map(val => (
                    <button key={val} className={`numpad-btn ${val === 1 ? 'selected' : ''}`}>
                        {val}
                    </button>
                ))}
            </div>

            <div className="toggles-section">
                <button className="toggle-btn bleeding">
                    Bleeding
                    <span className="toggle-indicator red"></span>
                </button>
                <button className="toggle-btn plaque">
                    Plaque
                    <span className="toggle-indicator blue"></span>
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="toggle-btn" style={{ flex: 1 }}>
                        Pus
                        <span className="toggle-indicator yellow"></span>
                    </button>
                    <button className="toggle-btn" style={{ flex: 1 }}>
                        Tartar
                        <span className="toggle-indicator"></span>
                    </button>
                </div>
            </div>

            <div className="drawer-footer">
                <div className="auto-switch">
                    <span>AUTOMATIC SEQUENTIAL PROBING</span>
                    <label className="switch">
                        <input type="checkbox" />
                        <span className="slider"></span>
                    </label>
                </div>
                <button className="next-btn" onClick={onNext}>NEXT TOOTH</button>
            </div>
        </div>
    );
};

export default PeriodontalDrawer;
