import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './DashboardDialog.css';

const EditBPEDialog = ({ isOpen, onClose, data, onSave }) => {
    const [formData, setFormData] = useState({
        upperRight: data?.upperRight || 0,
        upperAnterior: data?.upperAnterior || 0,
        upperLeft: data?.upperLeft || 0,
        lowerRight: data?.lowerRight || 0,
        lowerAnterior: data?.lowerAnterior || 0,
        lowerLeft: data?.lowerLeft || 0
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const renderSelect = (name, label) => (
        <div className="form-group">
            <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#6b7280' }}>{label}</label>
            <select
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className="form-select"
            >
                {[0, 1, 2, 3, 4, '*'].map(val => (
                    <option key={val} value={val}>{val}</option>
                ))}
            </select>
        </div>
    );

    return createPortal(
        <div className="dialog-backdrop">
            <div className="dialog-container large">
                <div className="dialog-header">
                    <h3 className="dialog-title">Edit BPE Scores</h3>
                    <button onClick={onClose} className="dialog-close-btn">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="dialog-body">
                    <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
                        {renderSelect('upperRight', 'Upper Right')}
                        {renderSelect('upperAnterior', 'Upper Anterior')}
                        {renderSelect('upperLeft', 'Upper Left')}

                        {renderSelect('lowerRight', 'Lower Right')}
                        {renderSelect('lowerAnterior', 'Lower Anterior')}
                        {renderSelect('lowerLeft', 'Lower Left')}
                    </div>

                    <div className="dialog-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-cancel"
                        >
                            Cancel
                        </button>
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
