import React from 'react';
import { NavLink, useParams, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Activity, ArrowLeft, Scan, Eye, EyeOff, Home } from 'lucide-react';
import useChartStore from '../store/chartStore';
import ToothIcon from './UI/ToothIcon';
import './PatientSidebar.css';
import { RiToothLine } from 'react-icons/ri';
import { FaRegFilePdf } from 'react-icons/fa';
import { GrDocumentPdf } from 'react-icons/gr';

const PatientSidebar = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showEndo, showPerio, showDental, toggleLayer } = useChartStore();

    // Check if we're on a chart route
    const isChartRoute = location.pathname.includes('/chart');

    return (
        <div className="patient-sidebar">
            <div className="sidebar-header">
                <button
                    onClick={() => {
                        if (location.pathname.endsWith('/dashboard')) {
                            navigate('/patients');
                        } else if (location.pathname.includes('/chart') || location.pathname.includes('/report')) {
                            navigate(`/patients/${patientId}/dashboard`);
                        } else {
                            navigate(-1);
                        }
                    }}
                    className="back-link"
                    title="Back"
                >
                    <ArrowLeft size={24} />
                </button>
            </div>

            <nav className="sidebar-nav">
                <NavLink
                    to={`/patients/${patientId}/chart`}
                    className={({ isActive }) =>
                        `sidebar-nav-link ${isActive ? 'active' : ''}`
                    }
                    title="Dental Chart"
                >
                    <RiToothLine size={24} />
                </NavLink>
                <NavLink
                    to={`/patients/${patientId}/dashboard`}
                    className={({ isActive }) =>
                        `sidebar-nav-link ${isActive ? 'active' : ''}`
                    }
                    title="Dashboard"
                >
                    <Home size={24} />
                </NavLink>

                <NavLink
                    to={`/patients/${patientId}/scan`}
                    className={({ isActive }) =>
                        `sidebar-nav-link ${isActive ? 'active' : ''}`
                    }
                    title="Scan"
                >
                    <Scan size={24} />
                </NavLink>

                <NavLink
                    to={`/patients/${patientId}/report`}
                    className={({ isActive }) =>
                        `sidebar-nav-link ${isActive ? 'active' : ''}`
                    }
                    title="Reports"
                >
                    <GrDocumentPdf size={24} />
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
                            DENT
                        </button>

                        <button
                            onClick={() => toggleLayer('perio')}
                            className={`layer-button ${showPerio ? 'active perio' : ''}`}
                            title="Toggle Perio Layer"
                        >
                            PERIO
                        </button>

                        <button
                            onClick={() => toggleLayer('endo')}
                            className={`layer-button ${showEndo ? 'active endo' : ''}`}
                            title="Toggle Endo Layer"
                        >
                            ENDO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientSidebar;
