import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './DashboardDialog.css';

const EditOralHealthDialog = ({ isOpen, onClose, data, onSave }) => {
    const [formData, setFormData] = useState({
        halitosis: data?.halitosis || 0
    });

    if (!isOpen) return null;

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
                    <button onClick={onClose} className="dialog-header-cancel">
                        Cancel
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="dialog-body">
                    <div className="form-group">
                        <label className="form-label">
                            Halitosis (1-5)
                        </label>
                        <div className="button-row">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    className={`number-btn ${num <= formData.halitosis ? 'active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, halitosis: num }))}
                                >
                                    {num}
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

export default EditOralHealthDialog;
