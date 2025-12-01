import React from 'react';
import ToothRenderer from '../ToothRenderer';
import { mapToothDataToConditions } from '../../../utils/toothUtils';

const UpperJawView = ({ teeth, onToothClick, selectedTeeth, activeTooth }) => {
    // Quadrants following standard dental notation
    // Q1 (Upper Right) - teeth 18-11
    // Q2 (Upper Left) - teeth 21-28
    const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
    const q2 = [21, 22, 23, 24, 25, 26, 27, 28];

    const upperTeethNumbers = [...q1, ...q2];

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
                    const isLingual = view === 'lingual';

                    return (
                        <div key={view} className={`trigger visualization ${isBuccal ? 'view-buccal' : isLingual ? 'view-lingual' : 'view-occlusal'}`} onClick={() => onToothClick(toothNumber)}>
                            <ToothRenderer
                                toothNumber={toothNumber}
                                view={view}
                                conditions={mapToothDataToConditions(tooth)}
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
        <div className="chart-overview-container" data-view="upper-jaw">
            <div className="full-mouth jaw-box">
                {/* Upper Jaw */}
                <ol className="jaw" data-type="upper">
                    {upperTeethNumbers.map(number =>
                        renderTooth(number, ['frontal', 'topview', 'lingual'])
                    )}
                </ol>
            </div>
        </div>
    );
};

export default UpperJawView;
