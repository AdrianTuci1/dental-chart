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

    // Sync chartView with URL on initial load only
    useEffect(() => {
        const path = location.pathname;
        if (path.endsWith('/upper-jaw')) {
            setChartView('upper');
        } else if (path.endsWith('/lower-jaw')) {
            setChartView('lower');
        } else if (!path.includes('/chart/')) {
            // Only reset to normal if we're navigating away from chart entirely
            setChartView('normal');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    const handleViewChange = (view) => {
        setChartView(view);

        const currentPath = location.pathname;
        // Remove existing view suffix
        let basePath = currentPath.replace(/\/upper-jaw$/, '').replace(/\/lower-jaw$/, '');

        // Remove trailing slash if present
        if (basePath.endsWith('/') && basePath.length > 1) {
            basePath = basePath.slice(0, -1);
        }

        if (view === 'normal') {
            navigate(basePath);
        } else {
            navigate(`${basePath}/${view}-jaw`);
        }
    };

    // Helper to get the correct path for navigation links
    const getNavPath = (basePath) => {
        const patientId = selectedPatient?.id || location.pathname.split('/')[2];
        const chartBase = `/patients/${patientId}/chart`;
        const fullBasePath = basePath ? `${chartBase}/${basePath}` : chartBase;

        if (chartView === 'normal') {
            return fullBasePath;
        }
        return `${fullBasePath}/${chartView}-jaw`;
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
