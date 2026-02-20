import React, { useEffect } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import usePatientStore from '../store/patientStore';
import useChartStore from '../store/chartStore';
import { MOCK_PATIENTS, generateMockTeeth } from '../utils/mockData';
import PatientSidebar from './PatientSidebar';

import './PatientLayout.css';

const PatientLayout = () => {
    const { patientId } = useParams();
    const { selectedPatient, selectPatient, patients, setPatients, updatePatient } = usePatientStore();
    const { setTeeth } = useChartStore();

    useEffect(() => {
        // Ensure patients are loaded
        if (patients.length === 0) {
            setPatients(MOCK_PATIENTS);
            return;
        }

        const patient = patients.find(p => p.id === patientId) || MOCK_PATIENTS.find(p => p.id === patientId);
        if (patient) {
            // Update selected patient if needed
            if (!selectedPatient || selectedPatient.id !== patientId) {
                selectPatient(patient);
            }

            // Always ensure the chartStore has this patient's teeth loaded
            if (patient.chart && patient.chart.teeth) {
                setTeeth(patient.chart.teeth);
            } else {
                const mockTeeth = generateMockTeeth();
                setTeeth(mockTeeth);
                updatePatient({
                    ...patient,
                    chart: {
                        ...patient.chart,
                        teeth: mockTeeth
                    }
                });
            }
        }
    }, [patientId, patients, selectedPatient, selectPatient, setPatients, setTeeth, updatePatient]);

    if (!selectedPatient) {
        return <div className="loading-state">Loading patient data...</div>;
    }

    return (
        <div className="patient-layout-container">
            <PatientSidebar />

            {/* Main Content Area */}
            <div className="layout-content" data-view="patient">
                <Outlet />
            </div>
        </div>
    );
};

export default PatientLayout;

