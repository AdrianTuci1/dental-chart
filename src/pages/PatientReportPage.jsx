import React from 'react';
import { Printer, Download, Mail, Activity, Heart, Wind, Cigarette, Wine, Snowflake, Flame, Hand, Gavel, Zap, Hourglass, AlertCircle } from 'lucide-react';
import { useAppStore } from '../core/store/appStore';
import NormalView from '../components/Chart/views/NormalView';
import UpperJawView from '../components/Chart/views/UpperJawView';
import LowerJawView from '../components/Chart/views/LowerJawView';

import './PatientReportPage.css';

const PatientReportPage = () => {
    const { selectedPatient, teeth } = useAppStore();

    if (!selectedPatient) return <div>Loading...</div>;

    // Helper to calculate age
    const calculateAge = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Process medical issues from store
    const getIssueDetails = (key) => {
        switch (key) {
            case 'highBloodPressure': return { icon: Heart, label: 'High blood pressure' };
            case 'asthma': return { icon: Wind, label: 'Asthma' };
            case 'acidReflux': return { icon: Activity, label: 'Acid reflux' };
            case 'tobaccoUse': return { icon: Cigarette, label: 'Tobacco use' };
            case 'alcoholUse': return { icon: Wine, label: 'Alcohol use' };
            default: return { icon: AlertCircle, label: key };
        }
    };

    const medicalIssuesList = [];
    if (selectedPatient.medicalIssues) {
        const { highBloodPressure, asthma, acidReflux, tobaccoUse, alcoholUse, other } = selectedPatient.medicalIssues;
        if (highBloodPressure) medicalIssuesList.push({ id: 'hbp', ...getIssueDetails('highBloodPressure') });
        if (asthma) medicalIssuesList.push({ id: 'asthma', ...getIssueDetails('asthma') });
        if (acidReflux) medicalIssuesList.push({ id: 'ar', ...getIssueDetails('acidReflux') });
        if (tobaccoUse) medicalIssuesList.push({ id: 'tu', ...getIssueDetails('tobaccoUse') });
        if (alcoholUse) medicalIssuesList.push({ id: 'au', ...getIssueDetails('alcoholUse') });

        if (Array.isArray(other)) {
            other.forEach((issue, idx) => {
                medicalIssuesList.push({ id: `other-${idx}`, icon: AlertCircle, label: issue });
            });
        }
    }

    // Group treatments by tooth (same logic as TreatmentPlan.jsx)
    const treatments = selectedPatient.treatmentPlan?.items || [];
    const groupedTreatments = treatments.reduce((acc, item) => {
        const toothKey = item.tooth || 'General';
        if (!acc[toothKey]) acc[toothKey] = [];
        acc[toothKey].push(item);
        return acc;
    }, {});

    return (
        <div className="report-page-layout">
            {/* Top Action Bar */}
            <div className="report-pdf-action-bar">
                <button className="create-pdf-btn">
                    CREATE PDF
                </button>
            </div>

            <div className="report-content-container">
                {/* Header Section */}
                <div className="report-header-section">
                    <h1 className="report-main-title">Patient information</h1>
                    <div className="clinic-logo-placeholder">
                        <div className="logo-icon">
                            <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px' }} />
                        </div>
                        <div className="logo-text">Pixtooth</div>
                    </div>
                </div>

                {/* Patient Information List */}
                <div className="patient-info-list">
                    <div className="info-row">
                        <span className="info-label">Patient name:</span>
                        <span className="info-value">{selectedPatient.fullName}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Date of birth:</span>
                        <span className="info-value">
                            {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            }) : 'N/A'} ({calculateAge(selectedPatient.dateOfBirth)} years)
                        </span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Praxis name:</span>
                        <span className="info-value">Adrian</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Treating doctor:</span>
                        <span className="info-value">Adrian</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Export created:</span>
                        <span className="info-value">
                            {new Date().toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            })}
                        </span>
                    </div>
                </div>

                {/* Medical Issues Section */}
                <div className="report-section">
                    <h2 className="section-heading">Medical Issues</h2>
                    <div className="medical-issues-grid">
                        {medicalIssuesList.length > 0 ? medicalIssuesList.map((issue) => (
                            <div key={issue.id} className="medical-issue-item">
                                <issue.icon className="issue-icon" size={20} />
                                <span className="issue-name">{issue.label}</span>
                            </div>
                        )) : (
                            <div className="no-issues-report">No known medical issues recorded.</div>
                        )}
                    </div>
                </div>

                <div className="section-divider"></div>

                {/* Treatment Plan Section */}
                <div className="report-section mt-8">
                    <h2 className="section-heading">Treatment Plan</h2>
                    <div className="treatment-plan-list">
                        {Object.entries(groupedTreatments).length > 0 ? Object.entries(groupedTreatments).map(([tooth, items]) => (
                            <div key={tooth} className="treatment-item-card">
                                <div className={`status-indicator status-planned`}></div>
                                <div className="treatment-details">
                                    <span className="treatment-desc">
                                        <span className="tooth-number">{tooth}, </span>
                                        {items.map((item, idx) => (
                                            <span key={item.id}>
                                                {item.procedure}
                                                {idx < items.length - 1 ? ', ' : ''}
                                            </span>
                                        ))}
                                    </span>
                                    <span className="treatment-date">
                                        {items[0].date ? new Date(items[0].date).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : ''}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state">No treatments pending.</div>
                        )}
                    </div>
                </div>

                <div className="section-divider"></div>

                {/* Chart Views Section */}
                <div className="report-section mt-8">
                    {/* Chart Views */}
                    <div className="report-chart-container">
                        <div className="chart-view-wrapper">
                            <h3 className="jaw-view-title">FULL JAW VIEW</h3>
                            <NormalView
                                teeth={teeth}
                                onToothClick={() => { }}
                                selectedTeeth={new Set()}
                                activeTooth={null}
                                showWaves={true}
                            />
                        </div>

                        {/* Custom Legend */}
                        <div className="chart-legend">
                            {/* Column 1: Periodontal */}
                            <div className="legend-column">
                                <h3 className="legend-title">PERIODONTAL</h3>
                                <div className="legend-item">
                                    <span className="legend-icon icon-probing">
                                        <svg viewBox="0 0 24 10" className="wave-icon-blue">
                                            <path d="M0,10 Q6,0 12,10 T24,10" fill="none" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    </span>
                                    <span className="legend-text">PROBING DEPTH</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-icon icon-gingival">
                                        <svg viewBox="0 0 24 10" className="wave-icon-red">
                                            <path d="M0,10 Q6,0 12,5 T24,5" fill="none" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    </span>
                                    <span className="legend-text">GINGIVAL MARGIN</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-icon icon-furcation">
                                        <svg viewBox="0 0 14 14" className="furcation-icon">
                                            <path d="M7,2 L12,12 L2,12 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    </span>
                                    <span className="legend-text">FURCATION STAGE 1</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-icon icon-furcation">
                                        <svg viewBox="0 0 14 14" className="furcation-icon">
                                            <path d="M7,2 L12,12 L2,12 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                                            <path d="M7,5 L10,10 L4,10 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                                        </svg>
                                    </span>
                                    <span className="legend-text">FURCATION STAGE 2</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-icon icon-furcation">
                                        <svg viewBox="0 0 14 14" className="furcation-icon">
                                            <path d="M7,2 L12,12 L2,12 Z" fill="currentColor" />
                                        </svg>
                                    </span>
                                    <span className="legend-text">FURCATION STAGE 3</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-icon icon-mobility">
                                        &lt; &nbsp; &gt;
                                    </span>
                                    <span className="legend-text">TOOTH MOBILITY CLASS 1</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-icon icon-mobility">
                                        &lt;&lt; &gt;&gt;
                                    </span>
                                    <span className="legend-text">TOOTH MOBILITY CLASS 2</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-icon icon-mobility">
                                        &lt;&lt;&lt; &gt;&gt;&gt;
                                    </span>
                                    <span className="legend-text">TOOTH MOBILITY CLASS 3</span>
                                </div>
                            </div>

                            {/* Column 2: Endo Tests */}
                            <div className="legend-column">
                                <h3 className="legend-title">ENDO TESTS</h3>
                                <div className="legend-item">
                                    <span className="legend-icon"><Snowflake size={18} className="endo-icon-cold" /></span>
                                    <span className="legend-text">COLD TEST</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-icon"><Flame size={18} className="endo-icon-heat" /></span>
                                    <span className="legend-text">HEAT TEST</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-icon"><Hand size={18} className="endo-icon-palpation" /></span>
                                    <span className="legend-text">PALPATION TEST</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-icon"><Gavel size={18} className="endo-icon-percussion" /></span>
                                    <span className="legend-text">PERCUSSION TEST</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-icon"><Zap size={18} className="endo-icon-electricity" /></span>
                                    <span className="legend-text">ELECTRICITY TEST</span>
                                </div>
                            </div>

                            {/* Column 3: Colour Coding & Other */}
                            <div className="legend-column">
                                <h3 className="legend-title">COLOUR CODING</h3>
                                <div className="legend-item">
                                    <span className="legend-icon circle-monitor">#</span>
                                    <span className="legend-text">MONITOR</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-icon circle-treatment">#</span>
                                    <span className="legend-text">TREATMENT</span>
                                </div>

                                <h3 className="legend-title mt-4">OTHER</h3>
                                <div className="legend-item">
                                    <span className="legend-icon circle-extraction">
                                        <Hourglass size={12} color="white" />
                                    </span>
                                    <span className="legend-text">TO BE EXTRACTED</span>
                                </div>
                            </div>
                        </div>

                        {/* Upper Jaw */}
                        <div className="chart-view-wrapper jaw-section-wrapper">
                            <h3 className="jaw-view-title">UPPER JAW</h3>
                            <div className="jaw-view-container">
                                <UpperJawView
                                    teeth={teeth}
                                    onToothClick={() => { }}
                                    selectedTeeth={new Set()}
                                    activeTooth={null}
                                />
                            </div>
                        </div>

                        {/* Lower Jaw */}
                        <div className="chart-view-wrapper jaw-section-wrapper">
                            <h3 className="jaw-view-title">LOWER JAW</h3>
                            <div className="jaw-view-container">
                                <LowerJawView
                                    teeth={teeth}
                                    onToothClick={() => { }}
                                    selectedTeeth={new Set()}
                                    activeTooth={null}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientReportPage;
