import React, { useState } from 'react';
import { AlertCircle, ChevronDown, Check, Info, X } from 'lucide-react';
import './DetectionsPanel.css';


const DetectionsPanel = ({ detections = [], onDelete }) => {
    const [isLegendOpen, setIsLegendOpen] = useState(true);

    return (
        <div className="detections-panel">

            {/* List */}
            <div className="detections-list">
                {detections.map((item, index) => (
                    <div key={item.id || index} className="detection-item">
                        <div className={`detection-tooth-number ${item.color}`}>
                            {item.tooth}
                        </div>
                        <div className="detection-description">{item.type}</div>
                        <button
                            className="detection-delete-btn"
                            onClick={() => onDelete && onDelete(item.id)}
                            title="Delete detection"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Legend / Footer area mock */}
            <div
                className={`detections-legend-header ${isLegendOpen ? 'open' : ''}`}
                onClick={() => setIsLegendOpen(!isLegendOpen)}
            >
                <span>Legend</span>
                <ChevronDown
                    size={16}
                    style={{
                        transform: isLegendOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                    }}
                />
            </div>
            <div className={`detections-legend-grid ${isLegendOpen ? 'visible' : ''}`}>
                <div className="legend-item"><span className="legend-dot red"></span>Caries</div>
                <div className="legend-item"><span className="legend-dot blue"></span>Filling</div>
                <div className="legend-item"><span className="legend-dot orange"></span>Periapical radiolucency</div>
                <div className="legend-item"><span className="legend-dot purple"></span>Implant</div>
                <div className="legend-item"><span className="legend-dot cyan"></span>Bridge</div>
                <div className="legend-item"><span className="legend-dot light-blue"></span>Root-canal filling</div>
                <div className="legend-item"><span className="legend-dot dark-blue"></span>Crown</div>
                <div className="legend-item"><span className="legend-dot green"></span>Mandibular canal</div>
            </div>
        </div>
    );
};

export default DetectionsPanel;
