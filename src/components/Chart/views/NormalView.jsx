import React, { useState, useEffect } from 'react';
import { Snowflake, Gavel, Hand, Flame, Zap } from 'lucide-react';
import JawTooth from './JawTooth';
import './NormalView.css';

const NormalView = ({
    teeth,
    onToothClick,
    selectedTeeth,
    activeTooth,
    upperJawViews = ['frontal', 'topview', 'number'],
    lowerJawViews = ['number', 'topview', 'frontal'],
    showWaves = true
}) => {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

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

    const getEndoIcons = (tooth, type) => {
        if (!tooth || !tooth.endodontic) return null;
        const iconDefs = [
            { key: 'cold', val: tooth.endodontic.cold, icon: <Snowflake size={18} className="endo-icon-cold" /> },
            { key: 'percussion', val: tooth.endodontic.percussion, icon: <Gavel size={18} className="endo-icon-percussion" /> },
            { key: 'palpation', val: tooth.endodontic.palpation, icon: <Hand size={18} className="endo-icon-palpation" /> },
            { key: 'heat', val: tooth.endodontic.heat, icon: <Flame size={18} className="endo-icon-heat" /> },
            { key: 'electricity', val: tooth.endodontic.electricity, icon: <Zap size={18} className="endo-icon-electricity" /> },
        ];

        const activeIcons = iconDefs.filter(d => d.val);
        if (activeIcons.length === 0) return null;

        // Cycle through active icons if there are more than one
        const currentIcon = activeIcons[tick % activeIcons.length];

        return (
            <div className="endo-indicator">
                {type === 'lower' && <div className="endo-line" />}
                <div key={currentIcon.key} className="endo-icon-wrap cycling">
                    {currentIcon.icon}
                </div>
                {type === 'upper' && <div className="endo-line" />}
            </div>
        );
    };

    return (
        <div className="chart-overview-container" data-view="full-mouth">
            <div className="full-mouth jaw-box">
                {/* Upper Jaw */}
                <ol className="jaw" data-type="upper">
                    {upperTeethNumbers.map(number => (
                        <li key={number} className="tooth-container">
                            <div className="endo-labels-container">
                                {getEndoIcons(teeth[number], 'upper')}
                            </div>
                            <JawTooth
                                toothNumber={number}
                                toothData={teeth[number]}
                                views={upperJawViews}
                                onToothClick={onToothClick}
                                isSelected={selectedTeeth && selectedTeeth.has(number)}
                                isDimmed={activeTooth && activeTooth !== number}
                                showWaves={showWaves}
                            />
                        </li>
                    ))}
                </ol>

                {/* Lower Jaw */}
                <ol className="jaw" data-type="lower">
                    {lowerTeethNumbers.map(number => (
                        <li key={number} className="tooth-container">
                            <JawTooth
                                toothNumber={number}
                                toothData={teeth[number]}
                                views={lowerJawViews}
                                onToothClick={onToothClick}
                                isSelected={selectedTeeth && selectedTeeth.has(number)}
                                isDimmed={activeTooth && activeTooth !== number}
                                showWaves={showWaves}
                            />
                            <div className="endo-labels-container">
                                {getEndoIcons(teeth[number], 'lower')}
                            </div>
                        </li>
                    ))}
                </ol>


            </div>
        </div >
    );
};

export default NormalView;
