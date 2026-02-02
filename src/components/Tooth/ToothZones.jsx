import React from 'react';
import { getToothType } from '../../utils/toothUtils';
import { ToothZone } from '../../models/Enums';
import './ToothZones.css';

const ToothZones = ({ selectedZones = [], onChange, inactive = false, toothNumber }) => {

    // Determine last 4 zones based on tooth type
    const getDynamicZones = () => {
        if (!toothNumber) return []; // Fallback or wait for data

        const type = getToothType(toothNumber);

        if (type === 'anterior') {
            // Incisor/Canine Layout
            return [
                { id: 'Class 4 Mesial', label: 'Cls 4 M', area: 'cusp1' }, // Mapped ID
                { id: 'Class 4 Distal', label: 'Cls 4 D', area: 'cusp2' }, // Mapped ID
                { id: ToothZone.BUCCAL, label: 'Buccal Surf', area: 'cusp3' }, // Full Surface
                { id: ToothZone.PALATAL, label: 'Palatal Surf', area: 'cusp4' }, // Full Surface
            ];
        } else {
            // Molar/Premolar Layout (Standard Cusps)
            return [
                { id: ToothZone.MESIO_BUCCAL_CUSP, label: 'MB Cusp', area: 'cusp1' },
                { id: ToothZone.DISTO_BUCCAL_CUSP, label: 'DB Cusp', area: 'cusp2' },
                { id: ToothZone.MESIO_PALATAL_CUSP, label: 'MP Cusp', area: 'cusp3' },
                { id: ToothZone.DISTO_PALATAL_CUSP, label: 'DP Cusp', area: 'cusp4' },
            ];
        }
    };

    const staticZones = [
        { id: ToothZone.CERVICAL_BUCCAL, label: 'Cervical Buccal', area: 'cervical1' },
        { id: ToothZone.BUCCAL, label: 'Buccal', area: 'direction1' },
        { id: ToothZone.MESIAL, label: 'Mesial', area: 'direction2' },
        { id: ToothZone.OCCLUSAL, label: 'Occlusal', area: 'direction3' },
        { id: ToothZone.DISTAL, label: 'Distal', area: 'direction4' },
        { id: ToothZone.PALATAL, label: 'Palatal', area: 'direction5' },
        { id: ToothZone.CERVICAL_PALATAL, label: 'Cervical Lingual', area: 'cervical2' },
    ];

    const zones = [...staticZones, ...getDynamicZones()];

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
