import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { ChevronLeft, PlusCircle, RefreshCw, XCircle, CheckCircle, Check } from 'lucide-react';
import { useAppStore } from '../../core/store/appStore';
import { AppFacade } from '../../core/AppFacade';
import ConfirmationModal from '../UI/ConfirmationModal';
import './ToothOverview.css';
import EndodonticSection from './EndodonticSection';
import PeriodontalSection from './PeriodontalSection';
import { ToothModel } from '../../core/models/ToothModel';

import EndoTestDetail from './EndoTestDetail';
import { suggestPulpalDiagnosis } from '../../utils/endoDiagnosis';
import { getEndoTests } from '../../utils/endoUtils';
import DiagnosisModal from './DiagnosisModal';

const ToothOverview = () => {
    const { tooth } = useOutletContext();
    const navigate = useNavigate();
    // No longer using updateTooth from store directly
    const { selectedPatient } = useAppStore();

    const [selectedTest, setSelectedTest] = useState(null);
    const [suggestedDiagnosis, setSuggestedDiagnosis] = useState(null);

    const handleTestSelect = (testName) => {
        setSelectedTest(testName);
    };

    const handleCloseTest = () => {
        setSelectedTest(null);
    };

    const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);

    const handleSaveTest = (testName, data) => {
        const testKey = testName.toLowerCase();
        const newResults = { ...getEndoTests(tooth?.endodontic), [testKey]: data };
        if (!data) {
            delete newResults[testKey];
        }

        // Update tooth in store with structured data
        // We also set boolean flags (cold, heat, etc) for NormalView icons
        const endoUpdate = {
            tests: newResults,
            [testKey]: !!data // flag for icons
        };

        const updatedEndo = { ...tooth.endodontic, ...endoUpdate };
        AppFacade.chart.updateTooth(tooth.isoNumber, { endodontic: updatedEndo });

        const diagnosis = suggestPulpalDiagnosis(newResults);
        // ... rest of diagnosis logic

        // Only show modal if diagnosis changed and is not null
        if (diagnosis && diagnosis !== suggestedDiagnosis) {
            setSuggestedDiagnosis(diagnosis);

            // If diagnosis is 'Normal Pulp', apply it automatically without modal
            if (diagnosis === 'Normal Pulp') {
                const updatedEndo = { ...tooth.endodontic, diagnosis: diagnosis };
                AppFacade.chart.updateTooth(tooth.isoNumber, { endodontic: updatedEndo });
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
        AppFacade.chart.updateTooth(tooth.isoNumber, { endodontic: updatedEndo });
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
        const toothNumber = tooth.isoNumber || tooth.toothNumber;

        if (modalState.action === 'reset') {
            AppFacade.chart.updateTooth(toothNumber, ToothModel.create(toothNumber));
        } else if (modalState.action === 'missing') {
            AppFacade.chart.updateTooth(toothNumber, {
                isMissing: true,
                missingDate: new Date().toISOString(),
            });
        }

        setModalState({ isOpen: false, action: null, title: '', message: '' });
    };

    const handleCancel = () => {
        setModalState({ isOpen: false, action: null, title: '', message: '' });
    };

    const handleDone = (itemId) => {
        if (selectedPatient) {
            AppFacade.patient.completeTreatment(selectedPatient.id, itemId);
        }
    };

    // Filter treatment plan items for this tooth
    // Making it more robust by checking item.tooth against tooth.isoNumber, tooth.toothNumber, or the param itself
    const toothTreatments = selectedPatient?.treatmentPlan?.items?.filter(
        item => parseInt(item.tooth) === parseInt(tooth.isoNumber || tooth.toothNumber)
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
                            {toothTreatments.map((item) => (
                                <div key={item.id} className="plan-item-grouped">
                                    <button className="done-btn-premium" onClick={() => handleDone(item.id)}>
                                        <Check size={14} />
                                        <span>DONE</span>
                                    </button>
                                    <div className="item-details">
                                        <p className="item-text">
                                            <span className="tooth-number-label">{tooth.isoNumber || tooth.toothNumber}, </span>
                                            <span className={`procedure-item ${item.status}`}>
                                                {item.procedure}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        "Currently there are no treatments pending"
                    )}
                </div>
            </div>

            {/* Bottom Half: Content Grid */}
            <div className="content-grid">
                {/* Endodontic Section (Left) */}
                <EndodonticSection onTestSelect={handleTestSelect} tooth={tooth} />

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
