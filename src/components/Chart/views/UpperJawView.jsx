import React from 'react';
import JawRow from '../JawRow';

const UpperJawView = ({ teeth, onToothClick }) => {
    // Quadrants following standard dental notation
    // Q1 (Upper Right) - teeth 18-11
    // Q2 (Upper Left) - teeth 21-28
    const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
    const q2 = [21, 22, 23, 24, 25, 26, 27, 28];

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

                    {/* Row 3: Upper Jaw Palatal */}
                    <tr className="upper-palatal-row">
                        <td>
                            <div className="quadrant-container">
                                <JawRow teeth={getTeethObjects(q1)} view="lingual" onToothClick={onToothClick} />
                                <JawRow teeth={getTeethObjects(q2)} view="lingual" onToothClick={onToothClick} />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default UpperJawView;
