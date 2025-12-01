import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './DashboardDialog.css';

const EditOralHealthDialog = ({ isOpen, onClose, data, onSave }) => {
    const [formData, setFormData] = useState({
        plaqueIndex: data?.plaqueIndex || 0,
        bleedingIndex: data?.bleedingIndex || 0,
        halitosis: data?.halitosis || false
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : Number(value)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return createPortal(
        <div className="dialog-backdrop">
            <div className="dialog-container">
                <div className="dialog-header">
                    <h3 className="dialog-title">Edit Oral Health</h3>
                    <button onClick={onClose} className="dialog-close-btn">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="dialog-body">
                    <div className="form-group">
                        <label className="form-label">
                            Plaque Index (%)
                        </label>
                        <input
                            type="number"
                            name="plaqueIndex"
                            min="0"
                            max="100"
                            value={formData.plaqueIndex}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Bleeding Index (%)
                        </label>
                        <input
                            type="number"
                            name="bleedingIndex"
                            min="0"
                            max="100"
                            value={formData.bleedingIndex}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>

                    <div className="form-checkbox-group">
                        <input
                            type="checkbox"
                            id="halitosis"
                            name="halitosis"
                            checked={formData.halitosis}
                            onChange={handleChange}
                            className="form-checkbox"
                        />
                        <label htmlFor="halitosis" className="form-label" style={{ marginBottom: 0 }}>
                            Halitosis
                        </label>
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

export default EditOralHealthDialog;
