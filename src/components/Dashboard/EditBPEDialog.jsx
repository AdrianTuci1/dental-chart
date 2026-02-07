import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './DashboardDialog.css';
import './BPEPanel.css';

const EditBPEDialog = ({ isOpen, onClose, data, onSave }) => {
    const [formData, setFormData] = useState({
        upperRight: data?.upperRight || 0,
        upperAnterior: data?.upperAnterior || 0,
        upperLeft: data?.upperLeft || 0,
        lowerRight: data?.lowerRight || 0,
        lowerAnterior: data?.lowerAnterior || 0,
        lowerLeft: data?.lowerLeft || 0
    });
    const [selectedSextant, setSelectedSextant] = useState('upperRight');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const handleScoreClick = (val) => {
        setFormData(prev => ({
            ...prev,
            [selectedSextant]: val
        }));
    };

    const isScoreActive = (buttonVal) => {
        const currentVal = formData[selectedSextant];
        if (buttonVal === '*') return currentVal === '*';
        if (currentVal === '*') return false;
        return Number(buttonVal) <= Number(currentVal);
    };

    const renderSextant = (name, label) => {
        const score = formData[name];
        const displayScore = score !== undefined && score !== null ? score : '0';

        return (
            <div
                className={`sextant-edit-box ${selectedSextant === name ? 'selected' : ''}`}
                onClick={() => setSelectedSextant(name)}
            >
                <div className="sextant-score-container">
                    <div className="sextant-line"></div>
                    <div className="sextant-circle">
                        <span className="sextant-value">{displayScore}</span>
                    </div>
                    <div className="sextant-line"></div>
                </div>
                <div className="sextant-label">{label}</div>
            </div>
        );
    };

    const scores = [0, 1, 2, 3, 4, '*'];

    return createPortal(
        <div className="dialog-backdrop">
            <div className="dialog-container large">
                <div className="dialog-header">
                    <h3 className="dialog-title">Edit BPE Scores</h3>
                    <button onClick={onClose} className="dialog-header-cancel">
                        Cancel
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="dialog-body">
                    <div className="bpe-edit-grid">
                        {renderSextant('upperRight', 'Upper Right')}
                        {renderSextant('upperAnterior', 'Upper Anterior')}
                        {renderSextant('upperLeft', 'Upper Left')}

                        {renderSextant('lowerRight', 'Lower Right')}
                        {renderSextant('lowerAnterior', 'Lower Anterior')}
                        {renderSextant('lowerLeft', 'Lower Left')}
                    </div>

                    <div className="bpe-combined-scoring-section">
                        <div className="bpe-scoring-row">
                            {scores.map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    className={`bpe-score-btn ${isScoreActive(val) ? 'active' : ''}`}
                                    onClick={() => handleScoreClick(val)}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="dialog-footer centered">
                        <button
                            type="submit"
                            className="btn btn-save"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default EditBPEDialog;
