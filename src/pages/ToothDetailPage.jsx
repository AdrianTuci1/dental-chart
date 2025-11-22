import React, { useEffect } from 'react';
import { Outlet, useParams, useNavigate, useMatch } from 'react-router-dom';
import useChartStore from '../store/chartStore';
import ToothVisualization from '../components/Tooth/ToothVisualization';
import { RefreshCw, XCircle, PlusCircle, ChevronLeft } from 'lucide-react';

import './ToothDetailPage.css';

const ToothDetailPage = () => {
    const { toothNumber } = useParams();
    const navigate = useNavigate();
    const { teeth, selectTooth } = useChartStore();

    // Check if we are at the exact tooth route (no sub-routes like /periodontal)
    // The path pattern must match the one in App.jsx
    const isExactToothRoute = useMatch('/patients/:patientId/chart/tooth/:toothNumber');

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
                    conditions={tooth.conditions}
                    onSelectTooth={handleToothSelect}
                />
            </div>

            {/* Main Content Area */}
            <div className="main-content">
                <Outlet context={{ tooth }} />
            </div>
        </div>
    );
};

export default ToothDetailPage;

