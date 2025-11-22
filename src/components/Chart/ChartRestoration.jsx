import React from 'react';
import useChartStore from '../../store/chartStore';

import { useNavigate, useParams } from 'react-router-dom';
import NormalView from './views/NormalView';
import UpperJawView from './views/UpperJawView';
import LowerJawView from './views/LowerJawView';

const ChartRestoration = () => {
    const { teeth, selectedTooth, selectTooth } = useChartStore();
    const navigate = useNavigate();
    const { patientId, view } = useParams();

    const handleToothClick = (toothNumber) => {
        selectTooth(toothNumber);
        navigate(`/patients/${patientId}/tooth/${toothNumber}/restoration`);
    };

    const renderView = () => {
        switch (view) {
            case 'upper-jaw':
                return <UpperJawView teeth={teeth} onToothClick={handleToothClick} />;
            case 'lower-jaw':
                return <LowerJawView teeth={teeth} onToothClick={handleToothClick} />;
            default:
                return <NormalView teeth={teeth} onToothClick={handleToothClick} />;
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                {renderView()}
            </div>

            {!selectedTooth ? (
                <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">Select a tooth from the chart above to add restoration.</p>
                </div>
            ) : (
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4">Add Restoration to Tooth {selectedTooth}</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {['Filling', 'Crown', 'Bridge', 'Veneer', 'Implant'].map(type => (
                            <button
                                key={type}
                                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-center"
                            >
                                <span className="block font-medium text-gray-900">{type}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChartRestoration;
