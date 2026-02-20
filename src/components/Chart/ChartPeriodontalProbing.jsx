import React from 'react';
import useChartStore from '../../store/chartStore';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';

import NormalView from './views/NormalView';
import UpperJawView from './views/UpperJawView';
import LowerJawView from './views/LowerJawView';

import PeriodontalDrawer from '../Drawers/PeriodontalDrawer';

const ChartPeriodontalProbing = () => {
    const { teeth, selectTooth, selectedTooth } = useChartStore();
    const { chartView } = useOutletContext();

    const handleToothClick = (toothNumber) => {
        selectTooth(toothNumber);
        // navigate(`/patients/${patientId}/tooth/${toothNumber}/periodontal`); // Disable navigation, use drawer
    };

    const handleCloseDrawer = () => {
        selectTooth(null);
    };

    const handleNextTooth = () => {
        if (!selectedTooth) return;
        const current = parseInt(selectedTooth);
        // Simple logic: increment. Real logic needs to follow dental arch (18->11, 21->28, 38->31, 41->48)
        // For now, let's just find the next available tooth in the map
        const toothNumbers = Object.keys(teeth).map(Number).sort((a, b) => a - b);
        const currentIndex = toothNumbers.indexOf(current);
        if (currentIndex !== -1 && currentIndex < toothNumbers.length - 1) {
            selectTooth(toothNumbers[currentIndex + 1]);
        }
    };

    const handlePreviousTooth = () => {
        if (!selectedTooth) return;
        const current = parseInt(selectedTooth);
        const toothNumbers = Object.keys(teeth).map(Number).sort((a, b) => a - b);
        const currentIndex = toothNumbers.indexOf(current);
        if (currentIndex > 0) {
            selectTooth(toothNumbers[currentIndex - 1]);
        }
    };

    const getDrawerPosition = (toothNumber) => {
        if (!toothNumber) return 'right';
        const n = parseInt(toothNumber);
        // Q1 (11-18) and Q4 (41-48) are on the LEFT side of the viewer (Patient's Right)
        // So drawer should be on the RIGHT.
        if ((n >= 11 && n <= 18) || (n >= 41 && n <= 48)) {
            return 'right';
        }
        // Q2 (21-28) and Q3 (31-38) are on the RIGHT side of the viewer (Patient's Left)
        // So drawer should be on the LEFT.
        return 'left';
    };

    const renderView = () => {
        const props = {
            teeth,
            onToothClick: handleToothClick,
            activeTooth: selectedTooth // Pass selectedTooth as activeTooth for dimming effect
        };

        switch (chartView) {
            case 'upper':
                return <UpperJawView {...props} />;
            case 'lower':
                return <LowerJawView {...props} />;
            default:
                return <NormalView {...props} />;
        }
    };

    return (
        <div className="chart-overview-container">
            {renderView()}
            {selectedTooth && (
                <PeriodontalDrawer
                    toothNumber={selectedTooth}
                    position={getDrawerPosition(selectedTooth)}
                    onClose={handleCloseDrawer}
                    onNext={handleNextTooth}
                    onPrevious={handlePreviousTooth}
                />
            )}
        </div>
    );
};

export default ChartPeriodontalProbing;
