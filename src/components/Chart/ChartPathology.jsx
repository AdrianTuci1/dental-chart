import React from 'react';
import useChartStore from '../../store/chartStore';

import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import NormalView from './views/NormalView';
import UpperJawView from './views/UpperJawView';
import LowerJawView from './views/LowerJawView';

const ChartPathology = () => {
    const { teeth, selectedTooth, selectTooth } = useChartStore();
    const navigate = useNavigate();
    const { patientId } = useParams();
    const { chartView } = useOutletContext();

    const handleToothClick = (toothNumber) => {
        selectTooth(toothNumber);
        navigate(`/patients/${patientId}/tooth/${toothNumber}/pathology`);
    };

    const renderView = () => {
        switch (chartView) {
            case 'upper':
                return <UpperJawView teeth={teeth} onToothClick={handleToothClick} />;
            case 'lower':
                return <LowerJawView teeth={teeth} onToothClick={handleToothClick} />;
            default:
                return <NormalView teeth={teeth} onToothClick={handleToothClick} />;
        }
    };

    return (
        <div className="chart-overview-container">
            {renderView()}
        </div>
    );
};

export default ChartPathology;
