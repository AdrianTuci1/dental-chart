import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useChartStore from '../store/chartStore';
import ScanView from '../components/Chart/views/ScanView';

const ScanPage = () => {
    const { teeth, setTeeth, selectTooth } = useChartStore();
    const { patientId } = useParams();
    const navigate = useNavigate();


    const handleToothClick = (toothNumber) => {
        selectTooth(toothNumber);
        navigate(`/patients/${patientId}/tooth/${toothNumber}`);
    };

    return (
        <div className="scan-page-wrapper">
            <main className="scan-page-main">
                <ScanView
                    teeth={teeth}
                    onToothClick={handleToothClick}
                    selectedTeeth={new Set()}
                    activeTooth={null}
                />
            </main>
        </div>
    );
};

export default ScanPage;
