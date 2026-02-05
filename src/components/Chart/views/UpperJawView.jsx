import React from 'react';
import JawTooth from './JawTooth';

const UpperJawView = ({ teeth, onToothClick, selectedTeeth, activeTooth }) => {
    // Quadrants following standard dental notation
    // Q1 (Upper Right) - teeth 18-11
    // Q2 (Upper Left) - teeth 21-28
    const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
    const q2 = [21, 22, 23, 24, 25, 26, 27, 28];

    const upperTeethNumbers = [...q1, ...q2];

    return (
        <div className="chart-overview-container" data-view="upper-jaw">
            <div className="full-mouth jaw-box">
                {/* Upper Jaw */}
                <ol className="jaw" data-type="upper">
                    {upperTeethNumbers.map((number, index) => (
                        <JawTooth
                            key={number}
                            toothNumber={number}
                            toothData={teeth[number]}
                            views={['frontal', 'topview', 'lingual']}
                            onToothClick={onToothClick}
                            isSelected={selectedTeeth && selectedTeeth.has(number)}
                            isDimmed={activeTooth && activeTooth !== number}
                            showPerioGrid={true}
                            showPerioLabels={index === 0}
                            showNumberAtBottom={true}
                        />
                    ))}
                </ol>
            </div>
        </div>
    );
};

export default UpperJawView;
