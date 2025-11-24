import React from 'react';
import ToothRenderer from '../ToothRenderer';
import { mapToothDataToConditions } from '../../../utils/toothUtils';

const LowerJawView = ({ teeth, onToothClick, selectedTeeth, activeTooth }) => {
    // Quadrants following standard dental notation
    // Q4 (Lower Right) - teeth 48-41
    // Q3 (Lower Left) - teeth 31-38
    const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
    const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

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
        <div className="chart-overview-container" data-view="lower-jaw">
            <div className="full-mouth jaw-box">
                {/* Lower Jaw */}
                <ol className="jaw" data-type="lower">
                    {lowerTeethNumbers.map(number =>
                        renderTooth(number, ['lingual', 'topview', 'frontal', 'number'])
                    )}
                </ol>
            </div>
        </div>
    );
};

export default LowerJawView;
