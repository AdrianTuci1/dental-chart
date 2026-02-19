import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { ChevronLeft, PlusCircle, RefreshCw, XCircle, CheckCircle } from 'lucide-react';
import useChartStore from '../../store/chartStore';
import usePatientStore from '../../store/patientStore';
import ConfirmationModal from '../UI/ConfirmationModal';
import './ToothOverview.css';
import EndodonticSection from './EndodonticSection';
import PeriodontalSection from './PeriodontalSection';

import EndoTestDetail from './EndoTestDetail';
import { suggestPulpalDiagnosis } from '../../utils/endoDiagnosis';
import DiagnosisModal from './DiagnosisModal';

const ToothOverview = () => {
    const { tooth } = useOutletContext();
    const navigate = useNavigate();
    const updateTooth = useChartStore(state => state.updateTooth);
    const { selectedPatient, completeTreatmentPlanItem } = usePatientStore();

    const [selectedTest, setSelectedTest] = useState(null);
    const [testResults, setTestResults] = useState({});
    const [suggestedDiagnosis, setSuggestedDiagnosis] = useState(null);

    const handleTestSelect = (testName) => {
        setSelectedTest(testName);
    };

    const handleCloseTest = () => {
        setSelectedTest(null);
    };

    const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);

    const handleSaveTest = (testName, data) => {
        const newResults = { ...testResults, [testName]: data };
        if (!data) {
            delete newResults[testName];
        }
        setTestResults(newResults);

        const diagnosis = suggestPulpalDiagnosis(newResults);

        // Only show modal if diagnosis changed and is not null
        if (diagnosis && diagnosis !== suggestedDiagnosis) {
            setSuggestedDiagnosis(diagnosis);

            // If diagnosis is 'Normal Pulp', apply it automatically without modal
            if (diagnosis === 'Normal Pulp') {
                const updatedEndo = { ...tooth.endodontic, diagnosis: diagnosis };
                updateTooth(tooth.isoNumber, { endodontic: updatedEndo });
                setShowDiagnosisModal(false);
            } else {
                setShowDiagnosisModal(true);
            }
        } else if (!diagnosis) {
            setSuggestedDiagnosis(null);
        }

        // Close EndoTestDetail after selection
        setSelectedTest(null);
    };

    const handleAcceptDiagnosis = () => {
        // Update the tooth model with the diagnosis
        // We need to ensure we are updating the endodontic object
        const updatedEndo = { ...tooth.endodontic, diagnosis: suggestedDiagnosis };
        updateTooth(tooth.isoNumber, { endodontic: updatedEndo });
        setShowDiagnosisModal(false);
    };

    const handleRejectDiagnosis = () => {
        setShowDiagnosisModal(false);
        // Optionally clear the suggestion or keep it but don't apply it
        // For now we just close the modal
    };



    const [modalState, setModalState] = useState({
        isOpen: false,
        action: null,
        title: '',
        message: ''
    });

    const handleResetClick = () => {
        setModalState({
            isOpen: true,
            action: 'reset',
            title: 'Reset Tooth',
            message: `Are you sure you want to reset all data for tooth ${tooth.isoNumber}? This action cannot be undone.`
        });
    };

    const handleMissingClick = () => {
        setModalState({
            isOpen: true,
            action: 'missing',
            title: 'Mark Tooth as Missing',
            message: `Are you sure you want to mark tooth ${tooth.isoNumber} as missing?`
        });
    };

    const handleConfirm = () => {
        if (modalState.action === 'reset') {
            // Reset the tooth
            tooth.reset();
            updateTooth(tooth.isoNumber, { ...tooth });
        } else if (modalState.action === 'missing') {
            // Mark tooth as missing
            updateTooth(tooth.isoNumber, { isMissing: true });
        }

        setModalState({ isOpen: false, action: null, title: '', message: '' });
    };

    const handleCancel = () => {
        setModalState({ isOpen: false, action: null, title: '', message: '' });
    };

    const handleDone = (itemId) => {
        if (selectedPatient) {
            completeTreatmentPlanItem(selectedPatient.id, itemId);
        }
    };

    // Filter treatment plan items for this tooth
    const toothTreatments = selectedPatient?.treatmentPlan?.items?.filter(
        item => parseInt(item.tooth) === parseInt(tooth.isoNumber)
    ) || [];



    return (
        <div className="tooth-overview-container">
            {/* Top Half: Header & Status */}
            <div className="top-section">
                <div className="header-row">
                    <div className="header-left">
                        <h1 className="page-title">Dental</h1>
                    </div>
                    <div className="header-actions">
                        <button className="action-btn" onClick={handleResetClick}>
                            <RefreshCw size={16} /> RESET
                        </button>
                        <button className="action-btn" onClick={handleMissingClick}>
                            <XCircle size={16} /> MISSING
                        </button>
                        <button className="action-btn" onClick={() => navigate('pathology')}>
                            <PlusCircle size={16} /> PATHOLOGY
                        </button>
                        <button className="action-btn" onClick={() => navigate('restoration')}>
                            <PlusCircle size={16} /> RESTORATION
                        </button>
                    </div>
                </div>

                <div className="status-message">
                    {toothTreatments.length > 0 ? (
                        <div className="tooth-treatment-list">
                            <div className="treatment-grouped">
                                {toothTreatments.map((item) => (
                                    <div key={item.id} className={`tooth-treatment-item ${item.status}`}>
                                        <button className="done-btn" onClick={() => handleDone(item.id)}>
                                            Done
                                        </button>
                                        <span className="tooth-card-number">{tooth.isoNumber}</span>
                                        <div className="treatment-info">
                                            <span className="treatment-name">
                                                {item.procedure}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        "Currently there are no treatments pending"
                    )}
                </div>

            </div>

            {/* Bottom Half: Content Grid */}
            <div className="content-grid">
                {/* Endodontic Section (Left) */}
                <EndodonticSection onTestSelect={handleTestSelect} />

                {/* Periodontal Section (Right) OR Endo Detail */}
                {selectedTest ? (
                    <EndoTestDetail
                        testName={selectedTest}
                        onClose={handleCloseTest}
                        onSave={handleSaveTest}
                    />
                ) : (
                    <PeriodontalSection />
                )}

            </div>

            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title={modalState.title}
                message={modalState.message}
            />

            <DiagnosisModal
                isOpen={showDiagnosisModal}
                diagnosis={suggestedDiagnosis}
                onAccept={handleAcceptDiagnosis}
                onReject={handleRejectDiagnosis}
            />
        </div>
    );
};

export default ToothOverview;
