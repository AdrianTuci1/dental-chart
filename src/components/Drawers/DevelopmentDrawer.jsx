import React from 'react';
import useChartStore from '../../store/chartStore';
import './DevelopmentDrawer.css';

const DevelopmentDrawer = ({ selectedTeeth, position = 'right', onClose }) => {
    const { updateTeeth } = useChartStore();

    if (!selectedTeeth || selectedTeeth.length === 0) return null;

    const hasAnteriorOrPremolar = selectedTeeth.some(toothNum => {
        const lastDigit = parseInt(toothNum) % 10;
        return lastDigit >= 1 && lastDigit <= 5;
    });

    const options = [
        { id: 'not-yet-developed', label: 'Not yet developed', action: { developmentState: 'not yet developed', isMissing: true } },
        ...(hasAnteriorOrPremolar ? [
            { id: 'baby-tooth', label: 'Baby tooth', action: { developmentState: 'baby tooth', isMissing: false } },
            { id: 'baby-tooth-missing', label: 'Baby tooth missing', action: { developmentState: 'baby tooth missing', isMissing: true } }
        ] : []),
        { id: 'adult-tooth', label: 'Adult tooth', action: { developmentState: 'adult tooth', isMissing: false } },
        { id: 'adult-tooth-missing', label: 'Adult tooth missing', action: { developmentState: 'adult tooth missing', isMissing: true } }
    ];

    const handleApply = (action) => {
        const updates = {};
        selectedTeeth.forEach(toothNumber => {
            const isMolar = parseInt(toothNumber) % 10 >= 6;
            if (isMolar && (action.developmentState === 'baby tooth' || action.developmentState === 'baby tooth missing')) {
                return;
            }
            updates[toothNumber] = { ...action };
        });
        updateTeeth(updates);
        onClose();
    };

    return (
        <div className={`dev-drawer ${position}`}>
            <div className="dev-drawer-header">
                <h2 className="dev-drawer-title">Development State</h2>
                <button onClick={onClose} className="dev-drawer-close">&times;</button>
            </div>

            <div className="dev-drawer-content">
                <p className="dev-drawer-description">
                    Select the development state for the {selectedTeeth.length} selected teeth.
                </p>
                <div className="dev-drawer-options">
                    {options.map(option => (
                        <button
                            key={option.id}
                            onClick={() => handleApply(option.action)}
                            className="dev-drawer-btn"
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DevelopmentDrawer;
