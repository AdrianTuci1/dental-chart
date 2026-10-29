import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useAppStore } from '../../core/store/appStore';

const ChartHeaderOverlay = ({ isScanView = false }) => {
    const { selectedPatient } = useAppStore();
    const { patientId } = useParams();
    const navigate = useNavigate();

    const toggleScanView = () => {
        if (isScanView) {
            navigate(`/patients/${patientId}/chart`);
        } else {
            navigate(`/patients/${patientId}/scan`);
        }
    };

    return (
        <div className="chart-topbar-container">
            {/* Patient Name */}
            <div className="chart-patient-name-static">
                {selectedPatient?.name || 'Patient'}
            </div>

            {/* Middle space or other breadcrumbs if needed */}
            <div className="topbar-spacer"></div>

            {/* Scan Link */}
            <button
                onClick={toggleScanView}
                className={`chart-scan-link-static ${isScanView ? 'active' : ''}`}
            >
                Scan
            </button>

            {/* Date Selector - Stays absolute bottom left as requested in previous layouts? 
                Actually, the user said "topbar ne lipseste". I'll keep the Date Selector as is or move it. 
                User said "in partea de sus ne trebuie navbar cu numele pacient, butonul scan".
            */}
            {!isScanView && (
                <div className="chart-date-selector-wrapper">
                    <button className="chart-date-selector" title="Select Date">
                        <Calendar size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChartHeaderOverlay;
