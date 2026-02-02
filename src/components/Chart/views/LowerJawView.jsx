import React from 'react';
import JawTooth from './JawTooth';

const LowerJawView = ({ teeth, onToothClick, selectedTeeth, activeTooth }) => {
    // Quadrants following standard dental notation
    // Q4 (Lower Right) - teeth 48-41
    // Q3 (Lower Left) - teeth 31-38
    const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
    const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

    const lowerTeethNumbers = [...q4, ...q3];

    return (
        <div className="chart-overview-container" data-view="lower-jaw">
            <div className="full-mouth jaw-box">
                {/* Lower Jaw */}
                <ol className="jaw" data-type="lower">
                    {lowerTeethNumbers.map(number => (
                        <JawTooth
                            key={number}
                            toothNumber={number}
                            toothData={teeth[number]}
                            views={['lingual', 'topview', 'frontal']}
                            onToothClick={onToothClick}
                            isDimmed={activeTooth && activeTooth !== number}
                            showPerioGrid={true}
                            showNumberAtBottom={true}
                        />
                    ))}
                </ol>
            </div>
        </div>
    );
};

export default LowerJawView;
