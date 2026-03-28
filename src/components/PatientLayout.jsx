import React, { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useAppStore } from '../core/store/appStore';
import { AppFacade } from '../core/AppFacade';
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
                // Use Facade for standardized loading
                const patientData = await AppFacade.patient.loadFull(patientId);

                if (isMounted && patientData) {
                    // Reconstruct teeth state from interventions
                    const projectedTeeth = ChartModel.projectTeethFromInterventions(
                        patientData.history || [],
                        patientData.treatmentPlan || []
                    );
                    setTeeth(projectedTeeth);
                }
            } catch (error) {
                console.error("Failed to load patient or chart data in layout", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadPatientData();

        return () => {
            isMounted = false;
        };
    }, [patientId, setTeeth]);

    if (isLoading) {
        return (
            <div className="loading-state" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#666' }}>
                <Loader2 className="spinner" style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                <span>Loading patient data and charts...</span>
            </div>
        );
    }

    if (!selectedPatient) {
        return (
            <div className="error-state" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#ef4444' }}>
                <h3>Error loading patient</h3>
                <p>The requested patient could not be found or there was an API error.</p>
                <button onClick={() => window.location.reload()} style={{ marginTop: '16px', padding: '8px 16px', background: '#ccc', borderRadius: '4px' }}>Retry</button>
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

