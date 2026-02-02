import React, { useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import usePatientStore from '../store/patientStore';
import useChartStore from '../store/chartStore';
import { Calendar } from 'lucide-react';

import './PatientChartPage.css';

const PatientChartPage = () => {
    const { selectedPatient } = usePatientStore();
    const { chartView, setChartView } = useChartStore();
    const location = useLocation();
    const navigate = useNavigate();

    // Sync chartView with URL on initial load and path changes
    useEffect(() => {
        const path = location.pathname;
        if (path.endsWith('/upper-jaw')) {
            setChartView('upper');
        } else if (path.endsWith('/lower-jaw')) {
            setChartView('lower');
        } else if (!path.includes('/chart/') || path.endsWith('/chart') || path.endsWith('/chart/')) {
            // Only reset to normal if we're navigating away from chart entirely or to root chart
            setChartView('normal');
        }
    }, [location.pathname, setChartView]);

    const handleViewChange = (view) => {
        setChartView(view);

        const patientId = selectedPatient?.id || location.pathname.split('/')[2];
        const patientRoot = `/patients/${patientId}`;
        const chartBase = `${patientRoot}/chart`;

        if (view === 'normal') {
            navigate(chartBase);
        } else if (view === 'upper' || view === 'lower') {
            navigate(`${chartBase}/${view}-jaw`);
        } else {
            navigate(`${chartBase}/${view}`);
        }
    };

    // Helper to get the correct path for navigation links
    const getNavPath = (basePath) => {
        const patientId = selectedPatient?.id || location.pathname.split('/')[2];
        const chartBase = `/patients/${patientId}/chart`;
        // If basePath is empty (Overview), return chartBase
        if (!basePath) return chartBase;

        return `${chartBase}/${basePath}`;
    };

    return (
        <main className="chart-page-container" data-view="chart">
            {/* Patient Name - Top Left (Absolute) */}
            <div className="chart-patient-name">
                {selectedPatient?.name || 'Patient'}
            </div>

            {/* Chart Navigation - Top Center (Absolute) */}
            <div className="chart-header">
                <div className="chart-nav">
                    <NavLink
                        to={getNavPath('')}
                        end
                        className={() => {
                            const path = location.pathname;
                            const isOverview = path.endsWith('/chart') ||
                                path.endsWith('/chart/') ||
                                path.endsWith('/chart/upper-jaw') ||
                                path.endsWith('/chart/lower-jaw');
                            return `chart-nav-link ${isOverview ? 'active' : ''}`;
                        }}
                    >
                        Overview
                    </NavLink>
                    <NavLink
                        to={getNavPath('quickselect')}
                        className={({ isActive }) =>
                            `chart-nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        Quickselect
                    </NavLink>
                    <NavLink
                        to={getNavPath('periodontal-probing')}
                        className={({ isActive }) =>
                            `chart-nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        Periodontal Probing
                    </NavLink>
                    <NavLink
                        to={getNavPath('pathology')}
                        className={({ isActive }) =>
                            `chart-nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        Pathology
                    </NavLink>
                    <NavLink
                        to={getNavPath('restoration')}
                        className={({ isActive }) =>
                            `chart-nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        Restoration
                    </NavLink>
                </div>
            </div>

            {/* Chart View Navigation - Top Right Center (Absolute) */}
            <div className="chart-view-selector">
                <button
                    className={`view-button ${chartView === 'normal' ? 'active' : ''}`}
                    onClick={() => handleViewChange('normal')}
                >
                    Normal
                </button>
                <button
                    className={`view-button ${chartView === 'upper' ? 'active' : ''}`}
                    onClick={() => handleViewChange('upper')}
                >
                    Upper Jaw
                </button>
                <button
                    className={`view-button ${chartView === 'lower' ? 'active' : ''}`}
                    onClick={() => handleViewChange('lower')}
                >
                    Lower Jaw
                </button>
            </div>

            {/* Date Selector - Bottom Left (Absolute) */}
            <button className="chart-date-selector" title="Select Date">
                <Calendar size={20} />
            </button>

            {/* Main Chart Content */}
            <Outlet context={{ chartView }} />
        </main>
    );
};

export default PatientChartPage;
