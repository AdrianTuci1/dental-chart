import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { ChevronLeft, PlusCircle, RefreshCw, XCircle, Snowflake, Gavel, Hand, Flame, Zap, CheckCircle } from 'lucide-react';
import useChartStore from '../../store/chartStore';
import usePatientStore from '../../store/patientStore';
import ConfirmationModal from '../UI/ConfirmationModal';
import './ToothOverview.css';

const ToothOverview = () => {
    const { tooth } = useOutletContext();
    const navigate = useNavigate();
    const updateTooth = useChartStore(state => state.updateTooth);
    const { selectedPatient, completeTreatmentPlanItem } = usePatientStore();

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

    const getIcon = (test) => {
        switch (test) {
            case 'Cold': return <Snowflake size={16} className="endo-icon text-blue-400" />;
            case 'Percussion': return <Gavel size={16} className="endo-icon text-gray-500" />;
            case 'Palpation': return <Hand size={16} className="endo-icon text-orange-400" />;
            case 'Heat': return <Flame size={16} className="endo-icon text-red-500" />;
            case 'Electricity': return <Zap size={16} className="endo-icon text-yellow-500" />;
            default: return <Zap size={16} className="endo-icon" />;
        }
    };

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
                            {toothTreatments.map(item => (
                                <div key={item.id} className={`tooth-treatment-item ${item.status}`}>
                                    <button className="done-btn" onClick={() => handleDone(item.id)}>
                                        Done
                                    </button>
                                    <div className="treatment-info">
                                        <span className="treatment-name">
                                            {item.procedure}
                                        </span>
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
                <div className="section-card">
                    <div className="section-header">
                        <h2>Endodontic</h2>
                    </div>
                    <div className="endo-list">
                        {['Cold', 'Percussion', 'Palpation', 'Heat', 'Electricity'].map(test => (
                            <div key={test} className="endo-item">
                                <div className="endo-label">
                                    {getIcon(test)} {test}
                                </div>
                                <div className="endo-action">
                                    Test <ChevronLeft size={16} className="rotate-180 ml-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Periodontal Section (Right) */}
                <div className="section-card">
                    <div className="section-header">
                        <h2>Periodontal</h2>
                        <button
                            onClick={() => navigate('periodontal')}
                            className="probing-btn"
                        >
                            <PlusCircle size={16} /> PROBING
                        </button>
                    </div>
                    <div className="perio-grid">
                        {/* Mock Data for Periodontal - In real app, map from tooth.periodontal.sites */}
                        {[
                            { label: 'Disto Lingual', val: 2, sub: 0, route: 'disto-lingual' },
                            { label: 'Lingual', val: 2, sub: 0, route: 'lingual' },
                            { label: 'Mesio Lingual', val: 1, sub: 0, route: 'mesio-lingual' },
                            { label: 'Disto Buccal', val: 1, sub: 0, route: 'disto-buccal' },
                            { label: 'Buccal', val: 1, sub: 0, route: 'buccal' },
                            { label: 'Mesio Buccal', val: 1, sub: 0, route: 'mesio-buccal' },
                        ].map((site, idx) => (
                            <div
                                key={idx}
                                className="perio-card"
                                onClick={() => navigate(`periodontal/${site.route}`)}
                            >
                                <div className="perio-value">{site.val}</div>
                                <div className="perio-sub">{site.sub}</div>
                                <div className="perio-label">{site.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title={modalState.title}
                message={modalState.message}
            />
        </div>
    );
};

export default ToothOverview;
