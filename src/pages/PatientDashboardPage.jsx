import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../core/store/appStore';
import { AppFacade } from '../core/AppFacade';
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
import { RiToothLine } from 'react-icons/ri';

const PatientDashboardPage = () => {
    const { selectedPatient, updatePatient } = useAppStore();
    const navigate = useNavigate();
    const { patientId: id } = useParams();
    const [activeTab, setActiveTab] = useState('treatment');
    const [isLoading, setIsLoading] = useState(true);

    // Dialog States
    const [isOralHealthOpen, setIsOralHealthOpen] = useState(false);
    const [isBPEOpen, setIsBPEOpen] = useState(false);
    const [isMedicalIssuesOpen, setIsMedicalIssuesOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const loadPatient = async () => {
            if (!id) return;
            
            if (selectedPatient && String(selectedPatient.id) === String(id)) {
                if (isMounted) setIsLoading(false);
                return;
            }

            if (isMounted) setIsLoading(true);
            try {
                await AppFacade.patient.loadFull(id);
            } catch (error) {
                console.error("Failed to load patient data", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadPatient();
        return () => { isMounted = false; };
    }, [id]);

    if (isLoading) {
        return <div className="loading-container" style={{ padding: '50px', textAlign: 'center' }}>Loading patient data...</div>;
    }

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

    // Handlers for saving data via Facade
    const handleSaveOralHealth = async (data) => {
        try {
            await AppFacade.patient.update(selectedPatient.id, {
                ...selectedPatient,
                oralHealth: { ...selectedPatient.oralHealth, ...data }
            });
        } catch (error) {
            console.error("Failed to update oral health", error);
        }
    };

    const handleSaveBPE = async (data) => {
        try {
            await AppFacade.patient.update(selectedPatient.id, {
                ...selectedPatient,
                bpe: { ...selectedPatient.bpe, ...data }
            });
        } catch (error) {
            console.error("Failed to update BPE", error);
        }
    };

    const handleSaveMedicalIssues = async (data) => {
        try {
            await AppFacade.patient.update(selectedPatient.id, {
                ...selectedPatient,
                medicalIssues: { ...selectedPatient.medicalIssues, ...data }
            });
        } catch (error) {
            console.error("Failed to update medical issues", error);
        }
    };

    return (
        <div className="dashboard-container">
            {/* Left Column: Header, Tabs, and Tab Content */}
            <div className="dashboard-content-left">
                <div className="dashboard-header">
                    <div className="patient-title-section">
                        <h1 className="patient-name-large">{selectedPatient.name}</h1>
                        <div className="patient-meta">
                            <span>{selectedPatient.gender}, {calculateAge(selectedPatient.dateOfBirth)}y</span>
                        </div>
                    </div>
                    <button
                        className="chart-action-button"
                        onClick={() => navigate(`/patients/${selectedPatient.id}/chart`)}
                    >
                        <RiToothLine size={18} style={{ marginRight: '4px' }} />
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
