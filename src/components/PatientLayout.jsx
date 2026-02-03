import React, { useEffect } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import usePatientStore from '../store/patientStore';
import { MOCK_PATIENTS } from '../utils/mockData';
import PatientSidebar from './PatientSidebar';

import './PatientLayout.css';

const PatientLayout = () => {
    const { patientId } = useParams();
    const { selectedPatient, selectPatient, patients, setPatients } = usePatientStore();

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
    }, [patientId, patients, selectedPatient, selectPatient, setPatients]);

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

