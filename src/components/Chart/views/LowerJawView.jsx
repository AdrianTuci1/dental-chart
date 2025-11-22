import React from 'react';
import JawRow from '../JawRow';

const LowerJawView = ({ teeth, onToothClick }) => {
    // Quadrants following standard dental notation
    // Q4 (Lower Right) - teeth 48-41
    // Q3 (Lower Left) - teeth 31-38
    const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
    const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

    const getTeethObjects = (numbers) => numbers.map(n => teeth[n]).filter(Boolean);

    return (
        <div className="chart-overview-container">
            <table className="dental-chart-table">
                <tbody>
                    {/* Row 1: Lower Jaw Palatal */}
                    <tr className="lower-palatal-row">
                        <td>
                            <div className="quadrant-container">
                                <JawRow teeth={getTeethObjects(q4)} view="lingual" onToothClick={onToothClick} />
                                <JawRow teeth={getTeethObjects(q3)} view="lingual" onToothClick={onToothClick} />
                            </div>
                        </td>
                    </tr>

                    {/* Row 2: Lower Jaw Occlusal */}
                    <tr className="lower-occlusal-row">
                        <td>
                            <div className="quadrant-container">
                                <JawRow teeth={getTeethObjects(q4)} view="topview" onToothClick={onToothClick} />
                                <JawRow teeth={getTeethObjects(q3)} view="topview" onToothClick={onToothClick} />
                            </div>
                        </td>
                    </tr>

                    {/* Row 3: Lower Jaw Buccal */}
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

export default LowerJawView;
