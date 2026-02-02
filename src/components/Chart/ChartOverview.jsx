import React, { useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import useChartStore from '../../store/chartStore';
import { generateMockTeeth } from '../../utils/mockData';

import './ChartOverview.css';
import NormalView from './views/NormalView';
import UpperJawView from './views/UpperJawView';
import LowerJawView from './views/LowerJawView';

const ChartOverview = () => {
    const { teeth, setTeeth, selectTooth } = useChartStore();
    const navigate = useNavigate();
    const { patientId } = useParams();
    const { chartView } = useOutletContext();

    useEffect(() => {
        if (Object.keys(teeth).length === 0) {
            setTeeth(generateMockTeeth());
        }
    }, [teeth, setTeeth]);

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
