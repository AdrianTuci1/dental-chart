import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppFacade } from '../../../../core/AppFacade';
import { getDisplayValue } from '../../profileUtils';

const OrganizationsView = ({ userProfile, onProfileRefresh }) => {
    const clinics = userProfile?.clinics || [];
    const pendingInvitations = userProfile?.pendingInvitations || [];
    const [selectedClinicId, setSelectedClinicId] = useState(null);
    const [savingClinicId, setSavingClinicId] = useState(null);
    const [inviteState, setInviteState] = useState({});
    const [clinicNameState, setClinicNameState] = useState({});
    const [transferTargets, setTransferTargets] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setClinicNameState(
            clinics.reduce((acc, clinic) => {
                acc[clinic.id] = clinic.name || '';
                return acc;
            }, {})
        );
    }, [clinics]);

    useEffect(() => {
        if (selectedClinicId && !clinics.some((clinic) => clinic.id === selectedClinicId)) {
            setSelectedClinicId(null);
        }
    }, [clinics, selectedClinicId]);

    const selectedClinic = useMemo(
        () => clinics.find((clinic) => clinic.id === selectedClinicId) || null,
        [clinics, selectedClinicId]
    );

    const resetFeedback = () => {
        setError('');
        setSuccess('');
    };

    const refreshProfile = async () => {
        if (typeof onProfileRefresh === 'function') {
            await onProfileRefresh();
        }
    };

    const updateInviteState = (clinicId, patch) => {
        setInviteState((current) => ({
            ...current,
            [clinicId]: {
                ...(current[clinicId] || { invitedEmail: '', role: 'member' }),
                ...patch,
            },
        }));
    };

    const withClinicAction = async (clinicId, action, successMessage) => {
        resetFeedback();
        setSavingClinicId(clinicId);

        try {
            await action();
            await refreshProfile();
            if (successMessage) {
                setSuccess(successMessage);
            }
        } catch (actionError) {
            setError(actionError?.message || 'Action failed.');
        } finally {
            setSavingClinicId(null);
        }
    };

    const handleRename = async (clinic) => {
        const nextName = clinicNameState[clinic.id];
        if (!nextName?.trim()) {
            setError('Organization name is required.');
            return;
        }

        await withClinicAction(
            clinic.id,
            () => AppFacade.clinic.rename(clinic.id, { name: nextName.trim() }),
            'Organization updated.'
        );
    };

    const handleInvite = async (clinic) => {
        const values = inviteState[clinic.id] || {};
        if (!values.invitedEmail?.trim()) {
            setError('Invite email is required.');
            return;
        }

        await withClinicAction(
            clinic.id,
            async () => {
                await AppFacade.clinic.inviteMember(clinic.id, {
                    invitedEmail: values.invitedEmail.trim(),
                    role: values.role || 'member',
                    invitedByMedicId: userProfile?.id,
                });
                updateInviteState(clinic.id, { invitedEmail: '' });
            },
            'Invitation sent.'
        );
    };

    const handleAcceptInvitation = async (invitation) => {
        await withClinicAction(
            invitation.clinicId,
            () => AppFacade.clinic.acceptInvitation(invitation.clinicId, invitation.id),
            'Invitation accepted.'
        );
    };

    const handleRemoveMember = async (clinic, medicId) => {
        await withClinicAction(
            clinic.id,
            () => AppFacade.clinic.removeMember(clinic.id, medicId),
            'Member removed.'
        );
    };

    const handleTransferOwnership = async (clinic) => {
        const targetMedicId = transferTargets[clinic.id];
        if (!targetMedicId) {
            setError('Select a member before transferring ownership.');
            return;
        }

        await withClinicAction(
            clinic.id,
            () => AppFacade.clinic.transferOwnership(clinic.id, targetMedicId),
            'Ownership transferred.'
        );
    };

    const handleDeleteClinic = async (clinic) => {
        await withClinicAction(
            clinic.id,
            async () => {
                await AppFacade.clinic.delete(clinic.id);
                setSelectedClinicId(null);
            },
            'Organization deleted.'
        );
    };

    const renderOrganizationsList = () => (
        <div className="modal-settings-groups">
            <div className="modal-settings-group">
                <h4>ORGANIZATIONS</h4>
                <div className="pro-settings-stack">
                    {error ? <p className="settings-inline-error">{error}</p> : null}
                    {success ? <p className="settings-inline-success">{success}</p> : null}
                    {clinics.length === 0 ? (
                        <div className="pro-settings-item vertical">
                            <div className="pro-settings-text">
                                <label>No organizations yet</label>
                                <p>You are not an active member in any clinic yet.</p>
                            </div>
                        </div>
                    ) : null}
                    {clinics.map((clinic) => (
                        <button
                            key={clinic.id}
                            type="button"
                            className="settings-clinic-list-item"
                            onClick={() => {
                                resetFeedback();
                                setSelectedClinicId(clinic.id);
                            }}
                        >
                            <div className="settings-clinic-list-copy">
                                <strong>{getDisplayValue(clinic.name)}</strong>
                                <span>{clinic.displayId || 'no value'}</span>
                            </div>
                            <span className="settings-inline-badge">{clinic.membership?.role || 'member'}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="modal-settings-group">
                <h4>PENDING INVITATIONS</h4>
                <div className="pro-settings-stack">
                    {pendingInvitations.length === 0 ? (
                        <div className="pro-settings-item vertical">
                            <div className="pro-settings-text">
                                <label>No pending invitations</label>
                                <p>When another clinic invites this account, the invite will appear here.</p>
                            </div>
                        </div>
                    ) : null}
                    {pendingInvitations.map((invitation) => (
                        <div className="pro-settings-item vertical" key={invitation.id}>
                            <div className="settings-card-topline">
                                <div className="pro-settings-text">
                                    <label>{getDisplayValue(invitation.clinicName)}</label>
                                    <p>
                                        Role: {getDisplayValue(invitation.role)}. Invite sent to {getDisplayValue(invitation.invitedEmail)}.
                                    </p>
                                </div>
                                <span className="settings-inline-badge">{invitation.clinicDisplayId || 'invite'}</span>
                            </div>
                            <button
                                className="pro-btn-secondary"
                                type="button"
                                disabled={savingClinicId === invitation.clinicId}
                                onClick={() => handleAcceptInvitation(invitation)}
                            >
                                Accept Invitation
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderClinicDetail = (clinic) => {
        const canManage = ['owner', 'admin'].includes(clinic.membership?.role);
        const isOwner = clinic.membership?.role === 'owner';
        const removableMembers = (clinic.members || []).filter((member) => member.role !== 'owner');

        return (
            <div className="modal-settings-groups">
                <div className="modal-settings-group">
                    <button className="settings-back-btn" type="button" onClick={() => setSelectedClinicId(null)}>
                        <ArrowLeft size={16} />
                        <span>Back to all organizations</span>
                    </button>
                </div>

                <div className="modal-settings-group">
                    <h4>ORGANIZATION DETAILS</h4>
                    <div className="pro-settings-stack">
                        {error ? <p className="settings-inline-error">{error}</p> : null}
                        {success ? <p className="settings-inline-success">{success}</p> : null}
                        <div className="pro-settings-item vertical">
                            <div className="settings-card-topline">
                                <div className="pro-settings-text">
                                    <label>{getDisplayValue(clinic.name)}</label>
                                    <p>{clinic.type === 'personal' ? 'Personal clinic' : 'Shared organization'}.</p>
                                </div>
                                <span className="settings-inline-badge">{clinic.membership?.role || 'member'}</span>
                            </div>
                            <div className="settings-meta-grid">
                                <div className="settings-meta-cell">
                                    <span>Organization Key</span>
                                    <strong>{clinic.displayId || 'no value'}</strong>
                                </div>
                                <div className="settings-meta-cell">
                                    <span>Owner</span>
                                    <strong>{getDisplayValue(clinic.ownerName || clinic.ownerEmail || clinic.ownerMedicId)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {canManage ? (
                    <div className="modal-settings-group">
                        <h4>ADMIN ACTIONS</h4>
                        <div className="pro-settings-stack">
                            <div className="pro-settings-item vertical">
                                <div className="organization-action-block">
                                    <label>Organization Name</label>
                                    <div className="api-key-box">
                                        <input
                                            type="text"
                                            className="api-key-input"
                                            value={clinicNameState[clinic.id] || ''}
                                            onChange={(event) => setClinicNameState((current) => ({
                                                ...current,
                                                [clinic.id]: event.target.value,
                                            }))}
                                        />
                                        <button
                                            className="pro-btn-secondary"
                                            type="button"
                                            disabled={savingClinicId === clinic.id}
                                            onClick={() => handleRename(clinic)}
                                        >
                                            Save Name
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="pro-settings-item vertical">
                                <div className="organization-action-block">
                                    <label>Invite Member</label>
                                    <div className="settings-invite-grid">
                                        <input
                                            type="email"
                                            className="api-key-input"
                                            placeholder="doctor@example.com"
                                            value={inviteState[clinic.id]?.invitedEmail || ''}
                                            onChange={(event) => updateInviteState(clinic.id, { invitedEmail: event.target.value })}
                                        />
                                        <select
                                            className="modal-settings-select"
                                            value={inviteState[clinic.id]?.role || 'member'}
                                            onChange={(event) => updateInviteState(clinic.id, { role: event.target.value })}
                                        >
                                            <option value="member">Member</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <button
                                            className="pro-btn-secondary"
                                            type="button"
                                            disabled={savingClinicId === clinic.id}
                                            onClick={() => handleInvite(clinic)}
                                        >
                                            Invite
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {isOwner ? (
                                <div className="pro-settings-item vertical">
                                    <div className="organization-action-block">
                                        <label>Transfer Ownership</label>
                                        <div className="settings-invite-grid">
                                            <select
                                                className="modal-settings-select"
                                                value={transferTargets[clinic.id] || ''}
                                                onChange={(event) => setTransferTargets((current) => ({
                                                    ...current,
                                                    [clinic.id]: event.target.value,
                                                }))}
                                            >
                                                <option value="">Select member</option>
                                                {removableMembers.map((member) => (
                                                    <option key={member.medicId} value={member.medicId}>
                                                        {member.name || member.email}
                                                    </option>
                                                ))}
                                            </select>
                                            <div />
                                            <button
                                                className="pro-btn-secondary"
                                                type="button"
                                                disabled={savingClinicId === clinic.id}
                                                onClick={() => handleTransferOwnership(clinic)}
                                            >
                                                Transfer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                            <div className="pro-settings-item">
                                <div className="pro-settings-text">
                                    <label>Delete Organization</label>
                                    <p>This removes the clinic and patients linked to it.</p>
                                </div>
                                <button
                                    className="pro-btn-danger"
                                    type="button"
                                    disabled={savingClinicId === clinic.id}
                                    onClick={() => handleDeleteClinic(clinic)}
                                >
                                    Delete Organization
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="modal-settings-group">
                    <h4>MEMBERS</h4>
                    <div className="pro-settings-stack">
                        {(clinic.members || []).map((member) => (
                            <div className="pro-settings-item" key={member.medicId}>
                                <div className="pro-settings-text">
                                    <label>{getDisplayValue(member.name)}</label>
                                    <p>{getDisplayValue(member.email)} · {getDisplayValue(member.role)}</p>
                                </div>
                                {canManage && member.role !== 'owner' ? (
                                    <button
                                        className="pro-btn-danger"
                                        type="button"
                                        disabled={savingClinicId === clinic.id}
                                        onClick={() => handleRemoveMember(clinic, member.medicId)}
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <span className="settings-inline-badge">{member.role || 'member'}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-settings-group">
                    <h4>PENDING INVITES</h4>
                    <div className="pro-settings-stack">
                        {(clinic.invitations || []).filter((invite) => invite.status === 'pending').length === 0 ? (
                            <div className="pro-settings-item vertical">
                                <div className="pro-settings-text">
                                    <label>No pending invites</label>
                                    <p>All invitations for this organization have been accepted or there are none yet.</p>
                                </div>
                            </div>
                        ) : (
                            clinic.invitations
                                .filter((invite) => invite.status === 'pending')
                                .map((invite) => (
                                    <div className="pro-settings-item" key={invite.id}>
                                        <div className="pro-settings-text">
                                            <label>{getDisplayValue(invite.invitedEmail)}</label>
                                            <p>Role: {getDisplayValue(invite.role)}</p>
                                        </div>
                                        <span className="settings-inline-badge">pending</span>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return selectedClinic ? renderClinicDetail(selectedClinic) : renderOrganizationsList();
};

export default OrganizationsView;
