import React, { useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../core/store/appStore';
import { AppFacade } from '../core/AppFacade';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import ToothIcon from '../components/UI/ToothIcon';

import './PatientChartPage.css';

const PatientChartPage = () => {
    const { selectedPatient, chartView, setChartView, historicalDate, setHistoricalDate } = useAppStore();
    const { patientId } = useParams();
    const [showTimeline, setShowTimeline] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        const loadPatient = async () => {
            if (!patientId) return;
            
            if (selectedPatient && String(selectedPatient.id) === String(patientId)) {
                if (isMounted) setIsLoading(false);
                return;
            }

            if (isMounted) setIsLoading(true);
            try {
                await AppFacade.patient.loadFull(patientId);
            } catch (error) {
                console.error("Failed to load patient for chart", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        loadPatient();
        return () => { isMounted = false; };
    }, [patientId]);

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

    // Extract unique dates from history, sort descending, and prepend 'null' for current view
    const historyItems = selectedPatient?.history?.completedItems || [];
    const uniqueDates = [...new Set(historyItems.map(item => item.date).filter(Boolean))].sort((a, b) => new Date(b) - new Date(a));
    const mockDates = [null, ...uniqueDates];

    const currentDateIndex = historicalDate ? mockDates.indexOf(historicalDate) : 0;

    const handlePrevDate = () => {
        // "Prev" means older in time (higher index in the descending array)
        // If we're at the oldest date, loop back to Current View (index 0) or stay there
        const nextIndex = (currentDateIndex + 1) % mockDates.length;
        setHistoricalDate(mockDates[nextIndex]);
    };

    const handleNextDate = () => {
        // "Next" means newer in time (lower index in the descending array)
        // If we're at Current View (index 0), loop back to oldest or stay there
        const prevIndex = (currentDateIndex - 1 + mockDates.length) % mockDates.length;
        setHistoricalDate(mockDates[prevIndex]);
    };


    const getNavPath = (basePath) => {
        const patientId = selectedPatient?.id || location.pathname.split('/')[2];
        const chartBase = `/patients/${patientId}/chart`;
        // If basePath is empty (Overview), return chartBase
        if (!basePath) return chartBase;

        return `${chartBase}/${basePath}`;
    };

    if (isLoading) {
        return <div className="loading-container" style={{ padding: '50px', textAlign: 'center' }}>Loading patient chart...</div>;
    }

    if (!selectedPatient) return null;

    return (
        <main className="chart-page-container" data-view="chart">
            {/* Patient Name - Top Left (Absolute) */}
            <div className="chart-patient-name">
                {selectedPatient.name}
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
                    className={`view-button ${chartView === 'upper' ? 'active' : ''}`}
                    onClick={() => handleViewChange('upper')}
                >
                    <ToothIcon type="upper" size={20} />
                </button>
                <button
                    className={`view-button ${chartView === 'normal' ? 'active' : ''}`}
                    onClick={() => handleViewChange('normal')}
                >
                    <ToothIcon type="full" size={20} />
                </button>
                <button
                    className={`view-button ${chartView === 'lower' ? 'active' : ''}`}
                    onClick={() => handleViewChange('lower')}
                >
                    <ToothIcon type="lower" size={20} />
                </button>
            </div>

            {/* Date Selector - Bottom Left (Absolute) */}
            {(() => {
                const path = location.pathname;
                const isOverview = path.endsWith('/chart') ||
                    path.endsWith('/chart/') ||
                    path.endsWith('/chart/upper-jaw') ||
                    path.endsWith('/chart/lower-jaw');
                return isOverview ? (
                    <button
                        className={`chart-date-selector ${showTimeline ? 'active' : ''}`}
                        title="Select Date"
                        onClick={() => setShowTimeline(!showTimeline)}
                    >
                        <Calendar size={20} />
                    </button>
                ) : null;
            })()}

            {/* Main Chart Content */}
            <div className="chart-outlet-container">
                <Outlet context={{ chartView }} />
            </div>

            {/* Timeline Footer */}
            {showTimeline && (
                <div className="timeline-footer">
                    <div className="time-picker-container">
                        <button className="timeline-nav-button" onClick={handlePrevDate}>
                            <ChevronLeft size={24} />
                        </button>
                        <div className="time-picker-display">
                            <div className="time-picker-label">History</div>
                            <div className="time-picker-value">
                                {historicalDate ? new Date(historicalDate).toLocaleDateString() : 'Current View'}
                            </div>
                        </div>
                        <button className="timeline-nav-button" onClick={handleNextDate}>
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default PatientChartPage;
