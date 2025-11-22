import React from 'react';
import JawRow from '../JawRow';

const NormalView = ({ teeth, onToothClick }) => {
    // Quadrants following standard dental notation
    // Q1 (Upper Right) - teeth 18-11
    // Q2 (Upper Left) - teeth 21-28
    // Q4 (Lower Right) - teeth 48-41
    // Q3 (Lower Left) - teeth 31-38
    const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
    const q2 = [21, 22, 23, 24, 25, 26, 27, 28];
    const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
    const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

    const getTeethObjects = (numbers) => numbers.map(n => teeth[n]).filter(Boolean);

    return (
        <div className="chart-overview-container">
            <table className="dental-chart-table">
                <tbody>
                    {/* Row 1: Upper Jaw Buccal */}
                    <tr className="upper-buccal-row">
                        <td>
                            <div className="quadrant-container">
                                <JawRow teeth={getTeethObjects(q1)} view="frontal" onToothClick={onToothClick} />
                                <JawRow teeth={getTeethObjects(q2)} view="frontal" onToothClick={onToothClick} />
                            </div>
                        </td>
                    </tr>

                    {/* Row 2: Upper Jaw Occlusal */}
                    <tr className="upper-occlusal-row">
                        <td>
                            <div className="quadrant-container">
                                <JawRow teeth={getTeethObjects(q1)} view="topview" onToothClick={onToothClick} />
                                <JawRow teeth={getTeethObjects(q2)} view="topview" onToothClick={onToothClick} />
                            </div>
                        </td>
                    </tr>

                    {/* Row 3: Upper Jaw Tooth Numbers */}
                    <tr className="upper-numbers-row">
                        <td>
                            <div className="quadrant-container">
                                <div className="tooth-numbers-row">
                                    {q1.map(num => (
                                        <div key={num} className="tooth-number-cell">{num}</div>
                                    ))}
                                </div>
                                <div className="tooth-numbers-row">
                                    {q2.map(num => (
                                        <div key={num} className="tooth-number-cell">{num}</div>
                                    ))}
                                </div>
                            </div>
                        </td>
                    </tr>


                    {/* Row 4: Lower Jaw Tooth Numbers */}
                    <tr className="lower-numbers-row">
                        <td>
                            <div className="quadrant-container">
                                <div className="tooth-numbers-row">
                                    {q4.map(num => (
                                        <div key={num} className="tooth-number-cell">{num}</div>
                                    ))}
                                </div>
                                <div className="tooth-numbers-row">
                                    {q3.map(num => (
                                        <div key={num} className="tooth-number-cell">{num}</div>
                                    ))}
                                </div>
                            </div>
                        </td>
                    </tr>

                    {/* Row 5: Lower Jaw Occlusal */}
                    <tr className="lower-occlusal-row">
                        <td>
                            <div className="quadrant-container">
                                <JawRow teeth={getTeethObjects(q4)} view="topview" onToothClick={onToothClick} />
                                <JawRow teeth={getTeethObjects(q3)} view="topview" onToothClick={onToothClick} />
                            </div>
                        </td>
                    </tr>

                    {/* Row 6: Lower Jaw Buccal */}
                    <tr className="lower-buccal-row">
                        <td>
                            <div className="quadrant-container">
                                <JawRow teeth={getTeethObjects(q4)} view="frontal" onToothClick={onToothClick} />
                                <JawRow teeth={getTeethObjects(q3)} view="frontal" onToothClick={onToothClick} />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default NormalView;
