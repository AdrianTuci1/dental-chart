import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import usePatientStore from '../store/patientStore';
import { Calendar } from 'lucide-react';

import './PatientChartPage.css';

const PatientChartPage = () => {
    const { selectedPatient } = usePatientStore();
    const location = useLocation();
    const navigate = useNavigate();

    // Determine current view from URL
    const getChartView = () => {
        const path = location.pathname;
        if (path.endsWith('/upper-jaw')) return 'upper';
        if (path.endsWith('/lower-jaw')) return 'lower';
        return 'normal';
    };

    const chartView = getChartView();

    const handleViewChange = (view) => {
        const currentPath = location.pathname;
        // Remove existing view suffix
        let basePath = currentPath.replace(/\/upper-jaw$/, '').replace(/\/lower-jaw$/, '');

        // Remove trailing slash if present (e.g. if we were at /chart/)
        if (basePath.endsWith('/') && basePath.length > 1) {
            basePath = basePath.slice(0, -1);
        }

        if (view === 'normal') {
            navigate(basePath);
        } else {
            navigate(`${basePath}/${view}-jaw`);
        }
    };

    return (
        <div className="chart-page-container">
            {/* Patient Name - Top Left (Absolute) */}
            <div className="chart-patient-name">
                {selectedPatient?.name || 'Patient'}
            </div>

            {/* Chart Navigation - Top Center (Absolute) */}
            <div className="chart-header">
                <div className="chart-nav">
                    <NavLink
                        to=""
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
                        to="quickselect"
                        className={({ isActive }) =>
                            `chart-nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        Quickselect
                    </NavLink>
                    <NavLink
                        to="periodontal-probing"
                        className={({ isActive }) =>
                            `chart-nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        Periodontal Probing
                    </NavLink>
                    <NavLink
                        to="pathology"
                        className={({ isActive }) =>
                            `chart-nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        Pathology
                    </NavLink>
                    <NavLink
                        to="restoration"
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
            <div className="chart-outlet-container">
                <Outlet context={{ chartView }} />
            </div>
        </div>
    );
};

export default PatientChartPage;
