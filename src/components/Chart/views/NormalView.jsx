import React from 'react';
import ToothRenderer from '../ToothRenderer';
import { mapToothDataToConditions } from '../../../utils/toothUtils';
import './NormalView.css';

const NormalView = ({ teeth, onToothClick, selectedTeeth, activeTooth }) => {
    // Quadrants following standard dental notation
    // Q1 (Upper Right) - teeth 18-11
    // Q2 (Upper Left) - teeth 21-28
    // Q4 (Lower Right) - teeth 48-41
    // Q3 (Lower Left) - teeth 31-38
    const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
    const q2 = [21, 22, 23, 24, 25, 26, 27, 28];
    const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
    const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

    const upperTeethNumbers = [...q1, ...q2];
    const lowerTeethNumbers = [...q4, ...q3];

    const renderTooth = (toothNumber, views) => {
        const tooth = teeth[toothNumber];
        if (!tooth) return null;

        const isSelected = selectedTeeth && selectedTeeth.has(toothNumber);
        const isDimmed = activeTooth && activeTooth !== toothNumber;

        return (
            <li key={toothNumber} className={`tooth ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''}`} data-number={toothNumber}>
                {views.map((view, index) => {
                    if (view === 'number') {
                        return (
                            <span key="number" className="number" onClick={() => onToothClick(toothNumber)}>
                                {toothNumber}
                            </span>
                        );
                    }

                    const isBuccal = view === 'frontal';

                    return (
                        <div key={view} className={`trigger visualization view-${isBuccal ? 'buccal' : 'occlusal'}`} onClick={() => onToothClick(toothNumber)}>
                            <ToothRenderer
                                toothNumber={toothNumber}
                                view={view}
                                conditions={mapToothDataToConditions(tooth)}
                                toothData={tooth}
                                interactive={true}
                                onSurfaceClick={(surface) => console.log(`Clicked surface ${surface} on tooth ${toothNumber}`)}
                            />
                            {isSelected && isBuccal && (
                                <div className="selection-overlay">
                                    <div className="checkmark-circle">
                                        ✓
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </li>
        );
    };

    return (
        <div className="chart-overview-container" data-view="full-mouth">
            <div className="full-mouth jaw-box">
                {/* Upper Jaw */}
                <ol className="jaw" data-type="upper">
                    {upperTeethNumbers.map(number =>
                        renderTooth(number, ['frontal', 'topview', 'number'])
                    )}
                </ol>

                {/* Lower Jaw */}
                <ol className="jaw" data-type="lower">
                    {lowerTeethNumbers.map(number =>
                        renderTooth(number, ['number', 'topview', 'frontal'])
                    )}
                </ol>
            </div>
        </div>
    );
};

export default NormalView;
