import React from 'react';
import { AlertCircle, ChevronDown, Check, Info } from 'lucide-react';
import './DetectionsPanel.css';

const DetectionsPanel = () => {
    // Mock data based on the screenshot
    const detections = [
        { id: 17, tooth: 17, type: 'Filling', status: 'detected' },
        { id: 16, tooth: 16, type: 'Filling', status: 'detected' },
        { id: 15, tooth: 15, type: 'Root-canal filling | Crown', status: 'detected' },
        { id: 14, tooth: 14, type: 'Filling', status: 'detected' },
        { id: 13, tooth: 13, type: 'Filling', status: 'detected' },
        { id: 12, tooth: 12, type: 'Crown', status: 'detected' },
        { id: 11, tooth: 11, type: 'Root-canal filling | Crown', status: 'detected' },
        { id: 21, tooth: 21, type: 'Periapical radiolucency\nCrown', status: 'detected' },
        { id: 22, tooth: 22, type: 'Periapical radiolucency\nRoot-canal filling | Crown', status: 'detected' },
    ];

    return (
        <div className="detections-panel">

            {/* Tabs */}
            <div className="detections-tabs">
                <div className="detections-tab active">Detections</div>
                <div className="detections-tab">Notes</div>
            </div>

            {/* List */}
            <div className="detections-list">
                {detections.map((item, index) => (
                    <div key={index} className="detection-item">
                        <div className="detection-tooth-number">{item.tooth}</div>
                        <div className="detection-description">{item.type}</div>
                    </div>
                ))}
            </div>

            {/* Legend / Footer area mock */}
            <div className="detections-legend-header">
                <span>Legend</span>
                <ChevronDown size={16} />
            </div>
            <div className="detections-legend-grid">
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
