import React, { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useAppStore } from '../core/store/appStore';
import { patientService } from '../api';
import { ChartModel } from '../core/models/ChartModel';
import PatientSidebar from './PatientSidebar';
import { Loader2 } from 'lucide-react';

import './PatientLayout.css';

const PatientLayout = () => {
    const { patientId } = useParams();
    const { selectedPatient, selectPatient } = useAppStore();
    const { setTeeth } = useAppStore();

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadPatientData = async () => {
            if (!patientId) return;

            setIsLoading(true);
            try {
                // Fetch ONLY the patient info. The chart is reconstructed locally.
                const patientData = await patientService.getPatientFull(patientId);

                if (isMounted && patientData) {
                    const projectedTeeth = ChartModel.projectTeethFromInterventions(
                        patientData.history || [],
                        patientData.treatmentPlan || []
                    );

                    selectPatient(patientData);
                    setTeeth(projectedTeeth);
                }
            } catch (error) {
                console.error("Failed to load patient or chart data", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        // Load full patient data to ensure we have medical history and treatment plans,
        // which are not available in the list view.
        loadPatientData();

        return () => {
            isMounted = false;
        };
    }, [patientId, selectPatient, setTeeth]); // Trigger when patient switching happens via URL

    if (isLoading || !selectedPatient) {
        return (
            <div className="loading-state" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#666' }}>
                <Loader2 className="spinner" style={{ animation: 'spin 1s linear infinite', marginRight: '10px' }} />
                <span>Loading patient data and charts...</span>
            </div>
        );
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

