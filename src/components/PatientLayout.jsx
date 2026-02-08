import React, { useEffect } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import usePatientStore from '../store/patientStore';
import useChartStore from '../store/chartStore';
import { MOCK_PATIENTS, generateMockTeeth } from '../utils/mockData';
import PatientSidebar from './PatientSidebar';

import './PatientLayout.css';

const PatientLayout = () => {
    const { patientId } = useParams();
    const { selectedPatient, selectPatient, patients, setPatients } = usePatientStore();
    const { teeth, setTeeth } = useChartStore();

    useEffect(() => {
        // Ensure patients are loaded
        if (patients.length === 0) {
            setPatients(MOCK_PATIENTS);
        }

        // Find and select patient if not selected or ID mismatch
        if (!selectedPatient || selectedPatient.id !== patientId) {
            const patient = patients.find(p => p.id === patientId) || MOCK_PATIENTS.find(p => p.id === patientId);
            if (patient) {
                selectPatient(patient);
            }
        }

        // Initialize teeth data if not already present
        if (Object.keys(teeth).length === 0) {
            setTeeth(generateMockTeeth());
        }
    }, [patientId, patients, selectedPatient, selectPatient, setPatients, teeth, setTeeth]);

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

