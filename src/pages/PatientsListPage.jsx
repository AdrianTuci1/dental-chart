import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../core/store/appStore';
import { authService } from '../api';
import { AppFacade } from '../core/AppFacade';
import { Search, Plus, User, Settings, Loader2, Trash2, UserPen, Pencil, MoreVertical } from 'lucide-react';
import SettingsModal from '../components/UI/SettingsModal';
import PatientModal from '../components/UI/PatientModal';
import './PatientsListPage.css';

const PatientsListPage = () => {
    const navigate = useNavigate();
    const { patients, setPatients, searchQuery, setSearchQuery, selectPatient, medicProfile, setMedicProfile } = useAppStore();
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, patient: null });
    const [activeMenuPatientId, setActiveMenuPatientId] = useState(null);
    const [patientModal, setPatientModal] = useState({ isOpen: false, patient: null, mode: 'add' });

    const fetchPatients = async () => {
        if (!medicProfile?.id) return;
        try {
            await AppFacade.patient.loadAll(medicProfile.id);
        } catch (error) {
            console.error("Failed to refresh patients", error);
        }
    };

    useEffect(() => {
        const initDashboard = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Medic Profile
                let currentProfile = medicProfile;
                if (!currentProfile) {
                    currentProfile = await authService.getCurrentUser();
                    setMedicProfile(currentProfile);
                }

                if (currentProfile && currentProfile.id) {
                    // 2. Fetch patients for THIS medic via Facade
                    await AppFacade.patient.loadAll(currentProfile.id);
                }
            } catch (error) {
                console.error("Failed to load dashboard data", error);
                // If it's an auth error, redirect to login
                if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('found'))) {
                    navigate('/');
                }
            } finally {
                setIsLoading(false);
            }
        };

        initDashboard();
    }, [medicProfile, setMedicProfile, setPatients, navigate]);

    useEffect(() => {
        const handleClickOutside = () => setActiveMenuPatientId(null);
        if (activeMenuPatientId) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [activeMenuPatientId]);

    const filteredPatients = patients.filter(patient =>
        (patient.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (patient.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePatientClick = (patient) => {
        selectPatient(patient);
        navigate(`/patients/${patient.id}`);
    };

    const handleDeleteClick = (e, patient) => {
        e.stopPropagation();
        setDeleteConfirm({ isOpen: true, patient });
        setActiveMenuPatientId(null);
    };

    const handleEditClick = (e, patient) => {
        e.stopPropagation();
        setPatientModal({ isOpen: true, patient, mode: 'edit' });
        setActiveMenuPatientId(null);
    };

    const toggleMenu = (e, patientId) => {
        e.stopPropagation();
        setActiveMenuPatientId(activeMenuPatientId === patientId ? null : patientId);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.patient) return;
        
        try {
            await AppFacade.patient.delete(deleteConfirm.patient.id);
            setDeleteConfirm({ isOpen: false, patient: null });
        } catch (error) {
            console.error("Failed to delete patient", error);
            alert("Failed to delete patient. Please try again.");
        }
    };

    return (
        <div className="patients-page-container">
            <div className="sticky-header">
                <div className="sticky-header-content">
                    <h1 className="sticky-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/logo.png" alt="logo" style={{ width: '30px', height: '30px' }} />
                        Patients</h1>
                    <div className="user-profile">
                        <span className="user-name">{medicProfile?.name || 'Loading...'}</span>
                        <button className="settings-btn" onClick={() => {
                            AppFacade.analytics.settingsOpened(medicProfile?.id || null);
                            setIsSettingsOpen(true);
                        }}>
                            <Settings size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="sub-header">
                <div className="search-input-inner">
                    <div className="search-icon-wrapper">
                        <Search className="search-icon" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search patients by name or email..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="add-patient-btn" onClick={() => setPatientModal({ isOpen: true, patient: null, mode: 'add' })}>
                    <Plus size={20} />
                    <span>Add Patient</span>
                </button>
            </div>

            <div className="table-container-wrapper">
                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px', color: '#666' }}>
                            <Loader2 className="spinner" style={{ animation: 'spin 1s linear infinite', marginRight: '10px' }} />
                            <span>Loading patients...</span>
                        </div>
                    ) : (
                        <table className="patients-table">
                            <thead>
                                <tr>
                                    <th scope="col" className="table-header-cell">
                                        Patient
                                    </th>
                                    <th scope="col" className="table-header-cell">
                                        Contact
                                    </th>
                                    <th scope="col" className="table-header-cell">
                                        Last Exam
                                    </th>
                                    <th scope="col" className="table-header-cell">
                                        Status
                                    </th>
                                    <th scope="col" className="table-header-cell" style={{ width: '80px' }}>
                                        {/* Actions spacer */}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map((patient) => (
                                    <tr
                                        key={patient.id}
                                        onClick={() => handlePatientClick(patient)}
                                        className={`table-row ${activeMenuPatientId === patient.id ? 'row-active' : ''}`}
                                    >
                                        <td className="table-cell">
                                            <div className="patient-info-wrapper">
                                                <div className="patient-details">
                                                    <div className="patient-name">
                                                        {patient.name}
                                                    </div>
                                                    <div className="patient-dob">
                                                        DOB: {patient.dateOfBirth}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="contact-email">{patient.email}</div>
                                            <div className="contact-phone">{patient.phone}</div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="last-exam-date">{patient.lastExamDate}</div>
                                        </td>
                                        <td className="table-cell">
                                            <span className="status-badge">
                                                Active
                                            </span>
                                        </td>
                                        <td className="table-cell table-cell-right">
                                            <div className="patient-actions-container">
                                                <button 
                                                    className={`action-trigger-btn ${activeMenuPatientId === patient.id ? 'active' : ''}`}
                                                    onClick={(e) => toggleMenu(e, patient.id)}
                                                    title="Patient Actions"
                                                >
                                                    <UserPen size={20} />
                                                </button>

                                                {activeMenuPatientId === patient.id && (
                                                    <div className="patient-context-menu" onClick={e => e.stopPropagation()}>
                                                        <button className="menu-item" onClick={(e) => handleEditClick(e, patient)}>
                                                            <Pencil size={16} />
                                                            <span>Edit Details</span>
                                                        </button>
                                                        <button className="menu-item delete-item" onClick={(e) => handleDeleteClick(e, patient)}>
                                                            <Trash2 size={16} />
                                                            <span>Delete Patient</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {!isLoading && filteredPatients.length === 0 && (
                    <div className="no-results">
                        No patients found matching your search.
                    </div>
                )}
            </div>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                userProfile={medicProfile}
            />

            <PatientModal
                isOpen={patientModal.isOpen}
                onClose={() => setPatientModal({ ...patientModal, isOpen: false })}
                onSuccess={fetchPatients}
                medicId={medicProfile?.id}
                initialData={patientModal.patient}
                mode={patientModal.mode}
            />

            {deleteConfirm.isOpen && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm({ isOpen: false, patient: null })}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="confirm-modal-content">
                            <h3>Are you sure?</h3>
                            <p>This action cannot be undone. Patient <strong>{deleteConfirm.patient?.name}</strong> and all associated data will be permanently removed.</p>
                            <div className="confirm-modal-actions">
                                <button className="cancel-btn" onClick={() => setDeleteConfirm({ isOpen: false, patient: null })}>
                                    Cancel
                                </button>
                                <button className="delete-btn-confirm" onClick={confirmDelete}>
                                    Delete Patient
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientsListPage;
