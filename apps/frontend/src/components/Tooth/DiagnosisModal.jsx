import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import './DiagnosisModal.css';

const DiagnosisModal = ({ isOpen, diagnosis, onAccept, onReject }) => {
    if (!isOpen) return null;

    return (
        <div className="diagnosis-modal-overlay">
            <div className="diagnosis-modal-content">
                <div className="diagnosis-modal-header">
                    <h3 className="diagnosis-modal-title">
                        <AlertCircle className="diagnosis-icon" size={20} />
                        Suggested Diagnosis
                    </h3>
                    <button
                        onClick={onReject}
                        className="close-modal-btn"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="diagnosis-modal-body">
                    <p className="diagnosis-text">
                        Based on the recorded test results, the suggested pulpal diagnosis is:
                    </p>
                    <div className="diagnosis-display-box">
                        <span className="diagnosis-result">
                            {diagnosis}
                        </span>
                    </div>
                    <p className="diagnosis-question">
                        Do you want to apply this diagnosis to the tooth record?
                    </p>
                </div>

                <div className="diagnosis-modal-actions">
                    <button
                        onClick={onAccept}
                        className="modal-btn modal-btn-confirm"
                    >
                        <CheckCircle size={16} />
                        Apply Diagnosis
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiagnosisModal;
