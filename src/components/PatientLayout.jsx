import React, { useEffect } from 'react';
import { Outlet, NavLink, useParams, useNavigate, useLocation } from 'react-router-dom';
import usePatientStore from '../store/patientStore';
import { MOCK_PATIENTS } from '../utils/mockData';
import { LayoutDashboard, FileText, Activity, ArrowLeft } from 'lucide-react';
import useChartStore from '../store/chartStore';
import { Layers, Eye, EyeOff } from 'lucide-react';

import './PatientLayout.css';

const PatientLayout = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedPatient, selectPatient, patients, setPatients } = usePatientStore();
    const { showEndo, showPerio, showDental, toggleLayer } = useChartStore();

    // Check if we're on a chart route
    const isChartRoute = location.pathname.includes('/chart');

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
        return <div className="p-8 text-center">Loading patient data...</div>;
    }

    return (
        <div className="patient-layout-container">
            {/* Patient Sidebar - Narrow Blue Strip */}
            <div className="patient-sidebar">
                <div className="sidebar-header">
                    <button
                        onClick={() => navigate('/patients')}
                        className="back-link"
                        title="Back to Patient List"
                    >
                        <ArrowLeft size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to={`/patients/${patientId}/dashboard`}
                        className={({ isActive }) =>
                            `sidebar-nav-link ${isActive ? 'active' : ''}`
                        }
                        title="Dashboard"
                    >
                        <LayoutDashboard size={24} />
                    </NavLink>

                    <NavLink
                        to={`/patients/${patientId}/chart`}
                        className={({ isActive }) =>
                            `sidebar-nav-link ${isActive ? 'active' : ''}`
                        }
                        title="Dental Chart"
                    >
                        <Activity size={24} />
                    </NavLink>

                    <NavLink
                        to={`/patients/${patientId}/report`}
                        className={({ isActive }) =>
                            `sidebar-nav-link ${isActive ? 'active' : ''}`
                        }
                        title="Reports"
                    >
                        <FileText size={24} />
                    </NavLink>
                </nav>

                {/* Layer Manager - Only visible on chart routes */}
                {isChartRoute && (
                    <div className="sidebar-footer">
                        <div className="layer-controls">
                            <button
                                onClick={() => toggleLayer('dental')}
                                className={`layer-button ${showDental ? 'active dental' : ''}`}
                                title="Toggle Dental Layer"
                            >
                                {showDental ? <Eye size={16} /> : <EyeOff size={16} />}
                                Dental
                            </button>

                            <button
                                onClick={() => toggleLayer('perio')}
                                className={`layer-button ${showPerio ? 'active perio' : ''}`}
                                title="Toggle Perio Layer"
                            >
                                {showPerio ? <Eye size={16} /> : <EyeOff size={16} />}
                                Perio
                            </button>

                            <button
                                onClick={() => toggleLayer('endo')}
                                className={`layer-button ${showEndo ? 'active endo' : ''}`}
                                title="Toggle Endo Layer"
                            >
                                {showEndo ? <Eye size={16} /> : <EyeOff size={16} />}
                                Endo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="layout-content" data-view="patient">
                <Outlet />
            </div>
        </div>
    );
};

export default PatientLayout;

