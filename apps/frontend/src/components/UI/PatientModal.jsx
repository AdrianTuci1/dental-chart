import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, Plus, Save } from 'lucide-react';
import { useAppStore } from '../../core/store/appStore';
import { AppFacade } from '../../core/AppFacade';
import './PatientModal.css';

const PatientModal = ({ isOpen, onClose, onSuccess, medicId, initialData = null, mode = 'add' }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    name: initialData.name || '',
                    email: initialData.email || '',
                    phone: initialData.phone || '',
                    dateOfBirth: initialData.dateOfBirth || '',
                    gender: initialData.gender || ''
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    dateOfBirth: '',
                    gender: ''
                });
            }
            setError(null);
        }
    }, [isOpen, mode, initialData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (mode === 'add') {
                await AppFacade.patient.add(formData, medicId);
            } else {
                // Edit mode
                await AppFacade.patient.update(initialData.id, formData);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(`Failed to ${mode} patient`, err);
            setError(err.message || `Failed to ${mode} patient. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="add-patient-modal" onClick={(e) => e.stopPropagation()}>
                <header className="modal-topbar">
                    <div className="topbar-content">
                        <h2>{mode === 'add' ? 'Add New Patient' : 'Edit Patient'}</h2>
                        <p>{mode === 'add' ? 'Fill in the details to register a new patient.' : 'Update the patient information below.'}</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </header>

                <div className="modal-content-area">
                    <form onSubmit={handleSubmit} className="add-patient-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="modal-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="john.doe@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="modal-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    placeholder="+40 7xx xxx xxx"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="modal-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="dateOfBirth">Date of Birth</label>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    className="modal-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="gender">Gender</label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="modal-input"
                                >
                                    <option value="" disabled>Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        {error && <div className="form-error" style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

                        <div className="form-actions">
                            <button type="submit" className="pro-btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        {mode === 'add' ? <Plus size={18} /> : <Save size={18} />}
                                        {mode === 'add' ? 'Create Patient' : 'Save Changes'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PatientModal;
