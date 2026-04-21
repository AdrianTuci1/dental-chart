import React from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useAppStore } from '../../core/store/appStore';

import './ChartOverview.css';
import NormalView from './views/NormalView';
import UpperJawView from './views/UpperJawView';
import LowerJawView from './views/LowerJawView';

const ChartOverview = () => {
    const { teeth, resolvedTeeth, selectTooth } = useAppStore();
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
                return <UpperJawView resolvedTeeth={resolvedTeeth || {}} onToothClick={handleToothClick} />;
            case 'lower':
                return <LowerJawView resolvedTeeth={resolvedTeeth || {}} onToothClick={handleToothClick} />;
            default:
                return <NormalView resolvedTeeth={resolvedTeeth || {}} onToothClick={handleToothClick} />;
        }
    };

    return (
        <div className="chart-overview-container">
            {renderView()}
        </div>
    );
};

export default ChartOverview;
