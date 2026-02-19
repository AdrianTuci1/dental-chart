import React, { useState } from 'react';
import { X, User, Mail, Phone, Calendar, Plus } from 'lucide-react';
import usePatientStore from '../../store/patientStore';
import './AddPatientModal.css';

const AddPatientModal = ({ isOpen, onClose }) => {
    const { addPatient } = usePatientStore();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newPatient = {
            id: Date.now().toString(),
            ...formData,
            lastExamDate: 'N/A',
            treatmentPlan: { items: [] },
            history: { completedItems: [] }
        };

        addPatient(newPatient);
        setFormData({
            fullName: '',
            email: '',
            phone: '',
            dateOfBirth: ''
        });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="add-patient-modal" onClick={(e) => e.stopPropagation()}>
                <header className="modal-topbar">
                    <div className="topbar-content">
                        <h2>Add New Patient</h2>
                        <p>Fill in the details to register a new patient.</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </header>

                <div className="modal-content-area">
                    <form onSubmit={handleSubmit} className="add-patient-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="fullName">Full Name</label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        placeholder="John Doe"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="john.doe@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <div className="input-wrapper">
                                    <Phone size={18} className="input-icon" />
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        placeholder="+40 7xx xxx xxx"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="dateOfBirth">Date of Birth</label>
                                <div className="input-wrapper">
                                    <Calendar size={18} className="input-icon" />
                                    <input
                                        type="date"
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="pro-btn-primary">
                                <Plus size={18} />
                                Create Patient
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddPatientModal;
