import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../core/store/appStore';
import { authService, patientService } from '../api';
import { Search, Plus, User, Settings, Loader2 } from 'lucide-react';
import SettingsModal from '../components/UI/SettingsModal';
import AddPatientModal from '../components/UI/AddPatientModal';
import './PatientsListPage.css';

const PatientsListPage = () => {
    const navigate = useNavigate();
    const { patients, setPatients, searchQuery, setSearchQuery, selectPatient, medicProfile, setMedicProfile } = useAppStore();
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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
                    // 2. Fetch patients for THIS medic
                    const data = await patientService.getPatients(currentProfile.id);
                    setPatients(data);
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

    const filteredPatients = patients.filter(patient =>
        patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePatientClick = (patient) => {
        selectPatient(patient);
        navigate(`/patients/${patient.id}`);
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
                        <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>
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
                <button className="add-patient-btn" onClick={() => setIsAddPatientOpen(true)}>
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
                                    <th scope="col" className="table-header-cell">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map((patient) => (
                                    <tr
                                        key={patient.id}
                                        onClick={() => handlePatientClick(patient)}
                                        className="table-row"
                                    >
                                        <td className="table-cell">
                                            <div className="patient-info-wrapper">
                                                <div className="patient-details">
                                                    <div className="patient-name">
                                                        {patient.fullName}
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
                                            <span className="view-link">
                                                View
                                            </span>
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

            <AddPatientModal
                isOpen={isAddPatientOpen}
                onClose={() => setIsAddPatientOpen(false)}
            />
        </div>
    );
};

export default PatientsListPage;
