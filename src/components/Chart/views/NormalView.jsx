import React from 'react';
import JawTooth from './JawTooth';
import './NormalView.css';

const NormalView = ({
    teeth,
    onToothClick,
    selectedTeeth,
    activeTooth,
    upperJawViews = ['frontal', 'topview', 'number'],
    lowerJawViews = ['number', 'topview', 'frontal']
}) => {
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

    return (
        <div className="chart-overview-container" data-view="full-mouth">
            <div className="full-mouth jaw-box">
                {/* Upper Jaw */}
                <ol className="jaw" data-type="upper">
                    {upperTeethNumbers.map(number => (
                        <JawTooth
                            key={number}
                            toothNumber={number}
                            toothData={teeth[number]}
                            views={upperJawViews}
                            onToothClick={onToothClick}
                            isSelected={selectedTeeth && selectedTeeth.has(number)}
                            isDimmed={activeTooth && activeTooth !== number}
                        />
                    ))}
                </ol>

                {/* Lower Jaw */}
                <ol className="jaw" data-type="lower">
                    {lowerTeethNumbers.map(number => (
                        <JawTooth
                            key={number}
                            toothNumber={number}
                            toothData={teeth[number]}
                            views={lowerJawViews}
                            onToothClick={onToothClick}
                            isSelected={selectedTeeth && selectedTeeth.has(number)}
                            isDimmed={activeTooth && activeTooth !== number}
                        />
                    ))}
                </ol>


            </div>
        </div >
    );
};

export default NormalView;
