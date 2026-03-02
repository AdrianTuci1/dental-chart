import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../core/store/appStore';
import { apiService } from '../services/apiService';
import { Search, Plus, User, Settings, Loader2 } from 'lucide-react';
import SettingsModal from '../components/UI/SettingsModal';
import AddPatientModal from '../components/UI/AddPatientModal';

import { user0profile } from '../utils/mockData';
import './PatientsListPage.css';

const PatientsListPage = () => {
    const navigate = useNavigate();
    const { patients, setPatients, searchQuery, setSearchQuery, selectPatient } = useAppStore();
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPatients = async () => {
            setIsLoading(true);
            try {
                // Fetch patients from our simulated API
                const data = await apiService.getPatients('medic-1');
                setPatients(data);
            } catch (error) {
                console.error("Failed to load patients", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (patients.length === 0) {
            fetchPatients();
        } else {
            setIsLoading(false);
        }
    }, [patients.length, setPatients]);

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
                        <span className="user-name">{user0profile.name}</span>
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
                userProfile={user0profile}
            />

            <AddPatientModal
                isOpen={isAddPatientOpen}
                onClose={() => setIsAddPatientOpen(false)}
            />
        </div>
    );
};

export default PatientsListPage;
