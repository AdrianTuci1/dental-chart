import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../core/store/appStore';
import { authService } from '../api';
import { AppFacade } from '../core/AppFacade';
import { clearClientSession } from '../core/session/sessionActions';
import { Search, Plus, MoreVertical, Pencil, Trash2, UserRoundSearch, UserPlus, X, ChevronDown, ChevronUp, CloudOff, RefreshCw } from 'lucide-react';
import SettingsModal from '../components/UI/SettingsModal';
import PatientModal from '../components/UI/PatientModal';
import WorkspaceSwitcher from '../components/UI/WorkspaceSwitcher';
import AccountMenu from '../components/UI/AccountMenu';
import { getAvatarColor, getInitials } from '../components/UI/profileUtils';
import {
    describeAge,
    describeGender,
    describeTimeSince,
    formatIsoDate,
    getPlanSummary,
    getSortValue,
    hasExamRecord,
} from '../utils/patientDisplay';
import './PatientsListPage.css';

const SORTABLE_COLUMNS = {
    name: { label: 'Patient', title: 'Sort by name' },
    lastExam: { label: 'Last exam', title: 'Sort by most recent exam' },
    plan: { label: 'Open plan', title: 'Sort by number of open treatments' },
};

// Height of the two-item row menu, used to decide whether it can open downwards.
const MENU_HEIGHT = 100;

const SortableHeaderCell = ({ label, columnKey, sort, onSort }) => {
    const isActive = sort.key === columnKey;

    return (
        <th
            scope="col"
            aria-sort={isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            className={`table-header-cell ${isActive ? 'is-sorted' : ''}`}
        >
            <button
                type="button"
                className="header-sort-btn"
                onClick={() => onSort(columnKey)}
                title={SORTABLE_COLUMNS[columnKey]?.title}
                aria-label={SORTABLE_COLUMNS[columnKey]?.title}
            >
                <span>{label}</span>
                {isActive ? (sort.direction === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : null}
            </button>
        </th>
    );
};

const PlanBadges = ({ patient }) => {
    const { planned, monitoring, open } = getPlanSummary(patient);

    if (open === 0) {
        return <span className="plan-empty">Nothing open</span>;
    }

    return (
        <div className="plan-badges">
            {planned > 0 ? <span className="plan-badge planned">{planned} planned</span> : null}
            {monitoring > 0 ? <span className="plan-badge monitoring">{monitoring} monitoring</span> : null}
        </div>
    );
};

const PatientRow = ({ patient, isMenuOpen, onOpen, onToggleMenu, onEdit, onDelete }) => {
    const age = describeAge(patient.dateOfBirth);
    const gender = describeGender(patient.gender);
    const birthDate = formatIsoDate(patient.dateOfBirth);
    const metaParts = [gender, age, birthDate].filter(Boolean);
    const examDate = hasExamRecord(patient.lastExamDate) ? formatIsoDate(patient.lastExamDate) : null;
    const examRelative = examDate ? describeTimeSince(patient.lastExamDate) : null;
    const displayName = patient.name || 'Unnamed patient';
    const actionsRef = useRef(null);
    const [dropUp, setDropUp] = useState(false);

    // The menu is absolutely positioned below the trigger; on the last rows that
    // would push it past the bottom edge of the window, so flip it upwards there.
    useEffect(() => {
        if (!isMenuOpen || !actionsRef.current) return;
        const { bottom } = actionsRef.current.getBoundingClientRect();
        setDropUp(bottom + MENU_HEIGHT > window.innerHeight);
    }, [isMenuOpen]);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(patient);
        }
    };

    return (
        <tr
            tabIndex={0}
            aria-label={`Open ${displayName}`}
            onClick={() => onOpen(patient)}
            onKeyDown={handleKeyDown}
            className={`table-row ${isMenuOpen ? 'row-active' : ''}`}
        >
            <td className="table-cell">
                <div className="patient-info-wrapper">
                    <span
                        className="patient-avatar"
                        style={{
                            backgroundColor: `${getAvatarColor(displayName)}22`,
                            color: getAvatarColor(displayName),
                        }}
                        aria-hidden="true"
                    >
                        {getInitials(displayName, patient.email)}
                    </span>
                    <div className="patient-details">
                        <div className="patient-name" title={displayName}>{displayName}</div>
                        {metaParts.length ? (
                            <div className="patient-dob" title={metaParts.join(' · ')}>{metaParts.join(' · ')}</div>
                        ) : null}
                    </div>
                </div>
            </td>
            <td className="table-cell">
                <div className="contact-email" title={patient.email || undefined}>
                    {patient.email || <span className="cell-muted">No email</span>}
                </div>
                <div className="contact-phone" title={patient.phone || undefined}>
                    {patient.phone || <span className="cell-muted">No phone</span>}
                </div>
            </td>
            <td className="table-cell">
                {examDate ? (
                    <>
                        <div className="last-exam-date">{examDate}</div>
                        <div className="last-exam-relative">{examRelative}</div>
                    </>
                ) : (
                    <span className="cell-muted">Never examined</span>
                )}
            </td>
            <td className="table-cell">
                <PlanBadges patient={patient} />
            </td>
            <td className="table-cell table-cell-right">
                <div className="patient-actions-container" ref={actionsRef}>
                    <button
                        type="button"
                        className={`action-trigger-btn ${isMenuOpen ? 'active' : ''}`}
                        onClick={(e) => onToggleMenu(e, patient.id)}
                        title="Patient actions"
                        aria-label={`Actions for ${displayName}`}
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                    >
                        <MoreVertical size={18} />
                    </button>

                    {isMenuOpen && (
                        <div className={`patient-context-menu ${dropUp ? 'menu-up' : ''}`} role="menu" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                role="menuitem"
                                className="menu-item"
                                onClick={(e) => onEdit(e, patient)}
                            >
                                <Pencil size={16} />
                                <span>Edit Details</span>
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                className="menu-item delete-item"
                                onClick={(e) => onDelete(e, patient)}
                            >
                                <Trash2 size={16} />
                                <span>Delete Patient</span>
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

const PatientsSkeleton = () => (
    <div className="patients-skeleton" aria-live="polite" aria-label="Loading patients">
        {[0, 1, 2, 3].map((row) => (
            <div className="skeleton-row" key={row}>
                <span className="skeleton-bone skeleton-avatar" />
                <span className="skeleton-bone skeleton-line" style={{ width: '38%' }} />
                <span className="skeleton-bone skeleton-line" style={{ width: '26%' }} />
                <span className="skeleton-bone skeleton-line" style={{ width: '14%' }} />
                <span className="skeleton-bone skeleton-pill" />
            </div>
        ))}
    </div>
);

const PatientsEmptyState = ({ isSearch, isError, onClearSearch, onAddPatient, onRetry }) => {
    let icon = <UserPlus size={26} />;
    let title = 'No patients in this workspace yet';
    let text = 'Add the first patient to start charting.';
    if (isSearch) {
        icon = <UserRoundSearch size={26} />;
        title = 'No patients match that search';
        text = 'Try a shorter name, an email address or a phone number.';
    } else if (isError) {
        icon = <CloudOff size={26} />;
        title = 'We could not load the patients';
        text = 'Check the connection and try again.';
    }

    return (
        <div className="patients-empty">
            <div className={`patients-empty-icon ${isError ? 'is-error' : ''}`}>{icon}</div>
            <h2 className="patients-empty-title">{title}</h2>
            <p className="patients-empty-text">{text}</p>
            {isError ? (
                <button type="button" className="patients-empty-action" onClick={onRetry}>
                    <RefreshCw size={17} />
                    <span>Try again</span>
                </button>
            ) : isSearch ? (
                <button type="button" className="patients-empty-action secondary" onClick={onClearSearch}>
                    Clear search
                </button>
            ) : (
                <button type="button" className="patients-empty-action" onClick={onAddPatient}>
                    <Plus size={17} />
                    <span>Add Patient</span>
                </button>
            )}
        </div>
    );
};

const PatientsListPage = () => {
    const navigate = useNavigate();
    const {
        patients,
        setPatients,
        searchQuery,
        setSearchQuery,
        selectPatient,
        medicProfile,
        setMedicProfile,
        activeClinicId,
        setActiveClinicId,
        syncActiveClinicWithProfile,
    } = useAppStore();
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [arePatientsLoading, setArePatientsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [reloadTick, setReloadTick] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, patient: null });
    const [activeMenuPatientId, setActiveMenuPatientId] = useState(null);
    const [patientModal, setPatientModal] = useState({ isOpen: false, patient: null, mode: 'add' });
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const headerRef = useRef(null);
    // The sticky table header has to sit right under the page header, whose height
    // depends on font scaling, so it is measured instead of guessed.
    const [headerOffset, setHeaderOffset] = useState(73);

    useEffect(() => {
        const measure = () => {
            if (headerRef.current) {
                setHeaderOffset(Math.round(headerRef.current.getBoundingClientRect().height));
            }
        };

        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const fetchPatients = async () => {
        if (!medicProfile?.id) return;
        try {
            await AppFacade.patient.loadAll(medicProfile.id, activeClinicId);
        } catch (error) {
            console.error("Failed to refresh patients", error);
        }
    };

    const refreshMedicProfile = async () => {
        const currentProfile = await authService.getCurrentUser();
        setMedicProfile(currentProfile);
        return currentProfile;
    };

    const handleSignOut = async () => {
        await clearClientSession();
        navigate('/');
    };

    useEffect(() => {
        const initDashboard = async () => {
            // Nothing to do once the session is gone (sign-out unmounts this page).
            if (!medicProfile && !localStorage.getItem('token')) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // 1. Fetch Medic Profile (the login response carries no workspace list)
                let currentProfile = medicProfile;
                if (!currentProfile || !Array.isArray(currentProfile.clinics)) {
                    currentProfile = await refreshMedicProfile();
                }

                // 2. Point the app at the workspace this account works in
                syncActiveClinicWithProfile(currentProfile);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
                // Without a profile the patients request never runs, so stop the
                // skeleton here and let the list fall back to its error state.
                setLoadError(true);
                setArePatientsLoading(false);
                // If it's an auth error, redirect to login
                if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('found'))) {
                    navigate('/');
                }
            } finally {
                setIsLoading(false);
            }
        };

        initDashboard();
    }, [medicProfile, setMedicProfile, setPatients, navigate, syncActiveClinicWithProfile, reloadTick]);

    useEffect(() => {
        if (!medicProfile?.id) return;

        const loadWorkspacePatients = async () => {
            setArePatientsLoading(true);
            setLoadError(false);
            try {
                await AppFacade.patient.loadAll(medicProfile.id, activeClinicId);
            } catch (error) {
                console.error("Failed to load workspace patients", error);
                setLoadError(true);
            } finally {
                setArePatientsLoading(false);
            }
        };

        loadWorkspacePatients();
    }, [medicProfile?.id, activeClinicId, reloadTick]);

    useEffect(() => {
        const handleClickOutside = () => setActiveMenuPatientId(null);
        const handleEscape = (event) => {
            if (event.key === 'Escape') setActiveMenuPatientId(null);
        };
        if (activeMenuPatientId) {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [activeMenuPatientId]);

    const visiblePatients = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const matches = query
            ? patients.filter((patient) =>
                (patient.name || '').toLowerCase().includes(query) ||
                (patient.email || '').toLowerCase().includes(query) ||
                (patient.phone || '').toLowerCase().includes(query))
            : patients;

        const direction = sort.direction === 'asc' ? 1 : -1;

        return [...matches].sort((a, b) => {
            const left = getSortValue(a, sort.key);
            const right = getSortValue(b, sort.key);

            if (left === right) {
                return (a.name || '').localeCompare(b.name || '');
            }

            return left > right ? direction : -direction;
        });
    }, [patients, searchQuery, sort]);

    const toggleSort = (key) => {
        setSort((current) => {
            if (current.key !== key) {
                // Dates and counts are read newest/most first; names alphabetically.
                return { key, direction: key === 'name' ? 'asc' : 'desc' };
            }

            return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
        });
    };

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
        <div className="patients-page-container" style={{ '--patients-header-offset': `${headerOffset}px` }}>
            <div className="sticky-header" ref={headerRef}>
                <div className="sticky-header-content">
                    <div className="sticky-header-left">
                        <h1 className="sticky-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src="/logo.png" alt="logo" style={{ width: '30px', height: '30px' }} />
                            Patients</h1>
                        <WorkspaceSwitcher
                            profile={medicProfile}
                            activeClinicId={activeClinicId}
                            onSelectWorkspace={setActiveClinicId}
                            onProfileRefresh={refreshMedicProfile}
                        />
                    </div>
                    <AccountMenu
                        profile={medicProfile}
                        onOpenSettings={() => {
                            AppFacade.analytics.settingsOpened(medicProfile?.id || null);
                            setIsSettingsOpen(true);
                        }}
                        onSignOut={handleSignOut}
                    />
                </div>
            </div>

            <div className="sub-header">
                <div className="search-input-inner">
                    <div className="search-icon-wrapper">
                        <Search className="search-icon" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search patients by name, email or phone..."
                        aria-label="Search patients"
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setSearchQuery('');
                        }}
                    />
                    {searchQuery ? (
                        <button
                            type="button"
                            className="search-clear"
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                            title="Clear search"
                        >
                            <X size={15} />
                        </button>
                    ) : null}
                </div>
                <div className="list-summary" aria-live="polite">
                    {isLoading || arePatientsLoading
                        ? 'Loading patients…'
                        : searchQuery
                            ? `${visiblePatients.length} of ${patients.length} ${patients.length === 1 ? 'patient' : 'patients'}`
                            : `${patients.length} ${patients.length === 1 ? 'patient' : 'patients'}`}
                </div>
                <button className="add-patient-btn" onClick={() => setPatientModal({ isOpen: true, patient: null, mode: 'add' })}>
                    <Plus size={20} />
                    <span>Add Patient</span>
                </button>
            </div>

            <div className="table-container-wrapper">
                <div className="table-container">
                    {isLoading || arePatientsLoading ? (
                        <PatientsSkeleton />
                    ) : loadError && patients.length === 0 ? (
                        <PatientsEmptyState
                            isError
                            onRetry={() => setReloadTick((tick) => tick + 1)}
                        />
                    ) : visiblePatients.length === 0 ? (
                        <PatientsEmptyState
                            isSearch={Boolean(searchQuery.trim())}
                            onClearSearch={() => setSearchQuery('')}
                            onAddPatient={() => setPatientModal({ isOpen: true, patient: null, mode: 'add' })}
                        />
                    ) : (
                        <table className="patients-table">
                            <colgroup>
                                <col className="col-patient" />
                                <col className="col-contact" />
                                <col className="col-exam" />
                                <col className="col-plan" />
                                <col className="col-actions" />
                            </colgroup>
                            <thead>
                                <tr>
                                    <SortableHeaderCell
                                        label="Patient"
                                        columnKey="name"
                                        sort={sort}
                                        onSort={toggleSort}
                                    />
                                    <th scope="col" className="table-header-cell">
                                        Contact
                                    </th>
                                    <SortableHeaderCell
                                        label="Last exam"
                                        columnKey="lastExam"
                                        sort={sort}
                                        onSort={toggleSort}
                                    />
                                    <SortableHeaderCell
                                        label="Open plan"
                                        columnKey="plan"
                                        sort={sort}
                                        onSort={toggleSort}
                                    />
                                    <th scope="col" className="table-header-cell table-header-cell-right">
                                        <span className="sr-only">Patient actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visiblePatients.map((patient) => (
                                    <PatientRow
                                        key={patient.id}
                                        patient={patient}
                                        isMenuOpen={activeMenuPatientId === patient.id}
                                        onOpen={handlePatientClick}
                                        onToggleMenu={toggleMenu}
                                        onEdit={handleEditClick}
                                        onDelete={handleDeleteClick}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                userProfile={medicProfile}
                onProfileRefresh={refreshMedicProfile}
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
