import React from 'react';
import './ToothZones.css';

const ToothZones = ({ selectedZones = [], onChange, inactive = false }) => {
    const zones = [
        { id: 'cervical-buccal', label: 'Cervical Buccal', area: 'cervical1' },
        { id: 'buccal', label: 'Buccal', area: 'direction1' },
        { id: 'mesial', label: 'Mesial', area: 'direction2' },
        { id: 'occlusal', label: 'Occlusal', area: 'direction3' },
        { id: 'distal', label: 'Distal', area: 'direction4' },
        { id: 'palatal', label: 'Palatal', area: 'direction5' },
        { id: 'cervical-lingual', label: 'Cervical Lingual', area: 'cervical2' },
        { id: 'mesio-buccal-cusp', label: 'MB Cusp', area: 'cusp1' },
        { id: 'disto-buccal-cusp', label: 'DB Cusp', area: 'cusp2' },
        { id: 'mesio-palatal-cusp', label: 'MP Cusp', area: 'cusp3' },
        { id: 'disto-palatal-cusp', label: 'DP Cusp', area: 'cusp4' },
    ];

    const handleZoneClick = (zoneId) => {
        // Don't allow clicks in inactive mode
        if (inactive || !onChange) return;

        const isSelected = selectedZones.includes(zoneId);
        const newZones = isSelected
            ? selectedZones.filter(z => z !== zoneId)
            : [...selectedZones, zoneId];

        onChange(newZones);
    };

    return (
        <div className="zones">
            <ul className="zones-list">
                {zones.map(zone => (
                    <li
                        key={zone.id}
                        className={`zone-pad ${selectedZones.includes(zone.id) ? 'selected' : ''} ${inactive ? 'inactive' : ''}`}
                        style={{ gridArea: zone.area }}
                        onClick={() => handleZoneClick(zone.id)}
                    >
                        {/* Don't show label text in inactive mode */}
                        {!inactive && zone.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ToothZones;
