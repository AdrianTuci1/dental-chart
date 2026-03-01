import React, { useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../core/store/appStore';
import ToothVisualization from '../components/Tooth/ToothVisualization';
import { mapToothDataToConditions } from '../utils/toothUtils';

import './ToothDetailPage.css';

const ToothDetailPage = () => {
    const { toothNumber } = useParams();
    const navigate = useNavigate();
    const { teeth, selectTooth } = useAppStore();



    const [previewData, setPreviewData] = React.useState(null);

    const tooth = teeth[toothNumber];

    useEffect(() => {
        if (toothNumber) {
            selectTooth(toothNumber);
        }
    }, [toothNumber, selectTooth]);

    if (!tooth) return <div className="p-8 text-center">Tooth not found</div>;

    const handleToothSelect = (num) => {
        navigate(`../tooth/${num}`);
    };

    return (
        <div className="tooth-detail-page">
            {/* Left Sidebar: Visualization */}
            <div className="visualization-sidebar">
                <ToothVisualization
                    toothNumber={toothNumber}
                    conditions={mapToothDataToConditions(previewData || tooth)}
                    onSelectTooth={handleToothSelect}
                    overrideToothData={previewData} // New prop for visualization if needed internally
                />
            </div>

            {/* Main Content Area */}
            <div className="main-content">
                <Outlet context={{ tooth, setPreviewData }} />
            </div>
        </div>
    );
};

export default ToothDetailPage;

