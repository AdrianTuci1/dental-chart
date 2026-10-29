import React from 'react';
import './PerioGrid.css';

const PerioGrid = ({ sites }) => {
    // sites should be an array of 3 site objects: [Mesial, Central, Distal]
    // If sites are not provided or incomplete, circles will be empty (inactive).

    // Rows definition matching the requirement: Plaque (Blue), Bleeding (Red), Pus (Yellow)
    const rows = [
        { key: 'plaque', color: 'blue' },
        { key: 'bleeding', color: 'red' },
        { key: 'pus', color: 'yellow' } // 'pus' might check for 'suppuration' as well in data logic if needed
    ];

    return (
        <div className="perio-indicators-grid">
            {rows.map((row) => (
                <div key={row.key} className="perio-row">
                    {/* Render 3 columns for Mesial, Central, Distal */}
                    {[0, 1, 2].map((colIndex) => {
                        const site = sites && sites[colIndex];
                        // Check if the property is true. 
                        // Note: For 'pus', data might use 'suppuration'. Check both.
                        const isPus = row.key === 'pus' && site && (site.pus || site.suppuration);
                        const isActive = isPus || (site && site[row.key]);

                        return (
                            <div
                                key={colIndex}
                                className={`perio-circle ${row.color} ${isActive ? 'active' : ''}`}
                                title={`${row.key} - ${['Mesial', 'Central', 'Distal'][colIndex]}`}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default PerioGrid;
