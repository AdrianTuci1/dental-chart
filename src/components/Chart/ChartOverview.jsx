import React from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useAppStore } from '../../core/store/appStore';

import './ChartOverview.css';
import NormalView from './views/NormalView';
import UpperJawView from './views/UpperJawView';
import LowerJawView from './views/LowerJawView';

const ChartOverview = () => {
    const { teeth, selectTooth } = useAppStore();
    const navigate = useNavigate();
    const { patientId } = useParams();
    const { chartView } = useOutletContext();


    const handleToothClick = (toothNumber) => {
        selectTooth(toothNumber);
        navigate(`/patients/${patientId}/tooth/${toothNumber}`);
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

export default ChartOverview;
