import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePatientStore from '../store/patientStore';
import TreatmentPlan from '../components/Dashboard/TreatmentPlan';
import History from '../components/Dashboard/History';
import OralHealthMetrics from '../components/Dashboard/OralHealthMetrics';
import BPEPanel from '../components/Dashboard/BPEPanel';
import MedicalIssuesPanel from '../components/Dashboard/MedicalIssuesPanel';
import EditOralHealthDialog from '../components/Dashboard/EditOralHealthDialog';
import EditBPEDialog from '../components/Dashboard/EditBPEDialog';
import EditMedicalIssuesDialog from '../components/Dashboard/EditMedicalIssuesDialog';
import { Activity } from 'lucide-react';

import './PatientDashboardPage.css';

const PatientDashboardPage = () => {
    const { selectedPatient, updatePatient } = usePatientStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('treatment');

    // Dialog States
    const [isOralHealthOpen, setIsOralHealthOpen] = useState(false);
    const [isBPEOpen, setIsBPEOpen] = useState(false);
    const [isMedicalIssuesOpen, setIsMedicalIssuesOpen] = useState(false);

    if (!selectedPatient) return null;

    // Calculate age helper
    const calculateAge = (dob) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Handlers for saving data
    const handleSaveOralHealth = (data) => {
        const updatedPatient = {
            ...selectedPatient,
            oralHealth: { ...selectedPatient.oralHealth, ...data }
        };
        updatePatient(updatedPatient);
    };

    const handleSaveBPE = (data) => {
        const updatedPatient = {
            ...selectedPatient,
            bpe: { ...selectedPatient.bpe, ...data }
        };
        updatePatient(updatedPatient);
    };

    const handleSaveMedicalIssues = (data) => {
        const updatedPatient = {
            ...selectedPatient,
            medicalIssues: { ...selectedPatient.medicalIssues, ...data }
        };
        updatePatient(updatedPatient);
    };

    return (
        <div className="dashboard-container">
            {/* Left Column: Header, Tabs, and Tab Content */}
            <div className="dashboard-content-left">
                <div className="dashboard-header">
                    <div className="patient-title-section">
                        <h1 className="patient-name-large">{selectedPatient.fullName}</h1>
                        <div className="patient-meta">
                            <span>{selectedPatient.gender}, {calculateAge(selectedPatient.dateOfBirth)}y</span>
                        </div>
                    </div>
                    <button
                        className="chart-action-button"
                        onClick={() => navigate(`/patients/${selectedPatient.id}/chart`)}
                    >
                        <Activity size={18} className="mr-2" />
                        CHART
                    </button>
                </div>

                <div className="dashboard-tabs-nav">
                    <button
                        className={`tab-link ${activeTab === 'treatment' ? 'active' : ''}`}
                        onClick={() => setActiveTab('treatment')}
                    >
                        TREATMENT PLAN
                    </button>
                    <button
                        className={`tab-link ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        HISTORY
                    </button>
                    <button
                        className={`tab-link ${activeTab === 'softTissue' ? 'active' : ''}`}
                        onClick={() => setActiveTab('softTissue')}
                    >
                        SOFT TISSUE
                    </button>
                </div>

                <div className="tab-content-area">
                    {activeTab === 'treatment' && (
                        <TreatmentPlan plan={selectedPatient.treatmentPlan} />
                    )}
                    {activeTab === 'history' && (
                        <History history={selectedPatient.history} />
                    )}
                    {activeTab === 'softTissue' && (
                        <div className="empty-state">
                            <p>Currently there are no treatments pending</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Widgets */}
            <div className="dashboard-right-col">
                {/* Oral Health Widget */}
                <div className="dashboard-widget">
                    <div className="widget-header">
                        <h3>Oral health</h3>
                        <button
                            className="edit-link"
                            onClick={() => setIsOralHealthOpen(true)}
                        >
                            EDIT
                        </button>
                    </div>
                    <OralHealthMetrics data={selectedPatient.oralHealth} />
                </div>

                {/* BPE Widget */}
                <div className="dashboard-widget">
                    <div className="widget-header">
                        <h3>Basic periodontal examination</h3>
                        <button
                            className="edit-link"
                            onClick={() => setIsBPEOpen(true)}
                        >
                            EDIT
                        </button>
                    </div>
                    <BPEPanel data={selectedPatient.bpe} />
                </div>

                {/* Medical Issues Widget */}
                <div className="dashboard-widget">
                    <div className="widget-header">
                        <h3>Medical issues</h3>
                        <button
                            className="edit-link"
                            onClick={() => setIsMedicalIssuesOpen(true)}
                        >
                            EDIT
                        </button>
                    </div>
                    <MedicalIssuesPanel data={selectedPatient.medicalIssues} />
                </div>
            </div>

            {/* Dialogs */}
            <EditOralHealthDialog
                isOpen={isOralHealthOpen}
                onClose={() => setIsOralHealthOpen(false)}
                data={selectedPatient.oralHealth}
                onSave={handleSaveOralHealth}
            />
            <EditBPEDialog
                isOpen={isBPEOpen}
                onClose={() => setIsBPEOpen(false)}
                data={selectedPatient.bpe}
                onSave={handleSaveBPE}
            />
            <EditMedicalIssuesDialog
                isOpen={isMedicalIssuesOpen}
                onClose={() => setIsMedicalIssuesOpen(false)}
                data={selectedPatient.medicalIssues}
                onSave={handleSaveMedicalIssues}
            />
        </div>
    );
};

export default PatientDashboardPage;
