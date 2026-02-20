import React from 'react';
import { getToothType } from '../../utils/toothUtils';
import { ToothZone } from '../../models/Enums';
import './ToothZones.css';

const ToothZones = ({ selectedZones = [], onChange, inactive = false, toothNumber, zoneColor, className, restorationType }) => {

    // Determine last 4 zones based on tooth index (last digit)
    const getDynamicZones = () => {
        if (!toothNumber) return [];

        const index = parseInt(toothNumber.toString().slice(-1), 10);

        // 1. Incisors (1, 2, 3)
        if (index === 1 || index === 2 || index === 3) {
            return [
                { id: 'Class 4 Mesial', label: 'Cls 4 M', area: 'cusp1' },
                { id: 'Class 4 Distal', label: 'Cls 4 D', area: 'cusp2' },
                { id: 'Buccal Surf', label: 'Buccal Surf', area: 'cusp3' },
                { id: 'Palatal Surf', label: 'Palatal Surf', area: 'cusp4' },
            ];
        }
        // 2. Canines & Premolars (4, 5)
        else if (index === 4 || index === 5) {
            return [
                { id: 'Buccal Cusp', label: 'Buccal Cusp', area: 'cusp1' },
                { id: 'Lingual Cusp', label: 'Lingual Cusp', area: 'cusp2' }, // Lingual/Palatal Cusp
                { id: 'Buccal Surf', label: 'Buccal Surf', area: 'cusp3' },
                { id: 'Lingual Surf', label: 'Lingual Surf', area: 'cusp4' },
            ];
        }
        // 3. Molars (6, 7, 8)
        else {
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

    const handleZoneClick = (zoneId, isZoneInactive) => {
        // Don't allow clicks in inactive mode
        if (isZoneInactive || !onChange) return;

        const isSelected = selectedZones.includes(zoneId);
        const newZones = isSelected
            ? selectedZones.filter(z => z !== zoneId)
            : [...selectedZones, zoneId];

        onChange(newZones);
    };

    return (
        <div className={`zones ${className || ''}`}>
            <ul className="zones-list">
                {zones.map(zone => {

                    let isZoneInactive = inactive;
                    if (!restorationType || restorationType === 'crown') {
                        isZoneInactive = true;
                    } else if (restorationType === 'veneer') {
                        if (zone.id !== ToothZone.BUCCAL && zone.id !== ToothZone.PALATAL) {
                            isZoneInactive = true;
                        }
                    } else if (restorationType === 'inlay') {
                        if (zone.id !== ToothZone.MESIAL && zone.id !== ToothZone.OCCLUSAL && zone.id !== ToothZone.DISTAL) {
                            isZoneInactive = true;
                        }
                    } else if (restorationType === 'onlay') {
                        if (zone.id !== ToothZone.MESIAL && zone.id !== ToothZone.DISTAL) {
                            isZoneInactive = true;
                        }
                    } else if (restorationType === 'partial_crown') {
                        const allowedPartialCrownZones = [
                            ToothZone.BUCCAL,
                            ToothZone.PALATAL,
                            'Buccal Cusp',
                            'Lingual Cusp',
                            ToothZone.MESIO_BUCCAL_CUSP,
                            ToothZone.DISTO_BUCCAL_CUSP,
                            ToothZone.MESIO_PALATAL_CUSP,
                            ToothZone.DISTO_PALATAL_CUSP
                        ];
                        if (!allowedPartialCrownZones.includes(zone.id)) {
                            isZoneInactive = true;
                        }
                    }

                    const isSelected = selectedZones.includes(zone.id);
                    const style = {
                        gridArea: zone.area,
                        // Apply dynamic color if selected, otherwise rely on CSS class
                        ...(isSelected && zoneColor ? {
                            backgroundColor: zoneColor,
                            color: '#ffffff', // Ensure text is readable on colored background
                            borderColor: zoneColor
                        } : {})
                    };

                    return (
                        <li
                            key={zone.id}
                            className={`zone-pad ${isSelected ? 'selected' : ''} ${isZoneInactive ? 'inactive' : ''}`}
                            style={style}
                            onClick={() => handleZoneClick(zone.id, isZoneInactive)}
                        >
                            {/* Don't show label text in inactive mode */}
                            {!isZoneInactive && zone.label}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default ToothZones;
