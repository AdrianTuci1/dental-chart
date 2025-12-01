import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './DashboardDialog.css';

const EditMedicalIssuesDialog = ({ isOpen, onClose, data, onSave }) => {
    const [formData, setFormData] = useState({
        highBloodPressure: data?.highBloodPressure || false,
        asthma: data?.asthma || false,
        acidReflux: data?.acidReflux || false,
        tobaccoUse: data?.tobaccoUse || false,
        alcoholUse: data?.alcoholUse || false,
        other: data?.other ? data.other.join(', ') : ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const processedData = {
            ...formData,
            other: formData.other.split(',').map(item => item.trim()).filter(item => item !== '')
        };
        onSave(processedData);
        onClose();
    };

    const renderCheckbox = (name, label) => (
        <div className="form-checkbox-group">
            <input
                type="checkbox"
                id={name}
                name={name}
                checked={formData[name]}
                onChange={handleChange}
                className="form-checkbox"
            />
            <label htmlFor={name} className="form-label" style={{ marginBottom: 0 }}>
                {label}
            </label>
        </div>
    );

    return createPortal(
        <div className="dialog-backdrop">
            <div className="dialog-container">
                <div className="dialog-header">
                    <h3 className="dialog-title">Edit Medical Issues</h3>
                    <button onClick={onClose} className="dialog-close-btn">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="dialog-body">
                    <div style={{ marginBottom: '1.5rem' }}>
                        {renderCheckbox('highBloodPressure', 'High Blood Pressure')}
                        {renderCheckbox('asthma', 'Asthma')}
                        {renderCheckbox('acidReflux', 'Acid Reflux')}
                        {renderCheckbox('tobaccoUse', 'Tobacco Use')}
                        {renderCheckbox('alcoholUse', 'Alcohol Use')}
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Other Issues (comma separated)
                        </label>
                        <textarea
                            name="other"
                            value={formData.other}
                            onChange={handleChange}
                            rows="3"
                            className="form-textarea"
                            placeholder="e.g. Diabetes, Allergies..."
                        />
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

export default EditMedicalIssuesDialog;
