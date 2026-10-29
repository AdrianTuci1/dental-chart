import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { AppFacade } from '../../../../core/AppFacade';
import { getDisplayValue } from '../../profileUtils';
import { isDefaultWorkspace } from '../../../../core/workspaces/workspaceHelpers';

const OrganizationsView = ({ userProfile, onProfileRefresh }) => {
    const clinics = userProfile?.clinics || [];
    const pendingInvitations = userProfile?.pendingInvitations || [];
    const [selectedClinicId, setSelectedClinicId] = useState(null);
    const [savingClinicId, setSavingClinicId] = useState(null);
    const [inviteState, setInviteState] = useState({});
    const [clinicNameState, setClinicNameState] = useState({});
    const [transferTargets, setTransferTargets] = useState({});
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
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

    const handleCreateWorkspace = async () => {
        const trimmedName = newWorkspaceName.trim();
        if (!trimmedName) {
            setError('Workspace name is required.');
            return;
        }

        resetFeedback();
        setIsCreatingWorkspace(true);

        try {
            const created = await AppFacade.clinic.create({ name: trimmedName });
            setNewWorkspaceName('');
            await refreshProfile();
            setSuccess(`Workspace "${created?.name || trimmedName}" created.`);
        } catch (actionError) {
            setError(actionError?.message || 'Could not create the workspace.');
        } finally {
            setIsCreatingWorkspace(false);
        }
    };

    const handleRename = async (clinic) => {
        const nextName = clinicNameState[clinic.id];
        if (!nextName?.trim()) {
            setError('Workspace name is required.');
            return;
        }

        await withClinicAction(
            clinic.id,
            () => AppFacade.clinic.rename(clinic.id, { name: nextName.trim() }),
            'Workspace updated.'
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
            'Workspace deleted.'
        );
    };

    const renderWorkspacesList = () => (
        <div className="modal-settings-groups">
            <div className="modal-settings-group">
                <h4>WORKSPACES</h4>
                <div className="pro-settings-stack">
                    {error ? <p className="settings-inline-error">{error}</p> : null}
                    {success ? <p className="settings-inline-success">{success}</p> : null}
                    {clinics.length === 0 ? (
                        <div className="pro-settings-item vertical">
                            <div className="pro-settings-text">
                                <label>No workspaces yet</label>
                                <p>Your account should have a default workspace. Create a shared one below to invite collaborators.</p>
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
                            <span className="settings-inline-badge">
                                {isDefaultWorkspace(clinic, userProfile) ? 'default' : clinic.membership?.role || 'member'}
                            </span>
                        </button>
                    ))}
                    <div className="pro-settings-item vertical">
                        <div className="organization-action-block">
                            <label>New Workspace</label>
                            <div className="api-key-box">
                                <input
                                    type="text"
                                    className="api-key-input"
                                    placeholder="Shared practice name"
                                    value={newWorkspaceName}
                                    onChange={(event) => setNewWorkspaceName(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            handleCreateWorkspace();
                                        }
                                    }}
                                />
                                <button
                                    className="pro-btn-secondary pro-btn-icon"
                                    type="button"
                                    disabled={isCreatingWorkspace}
                                    onClick={handleCreateWorkspace}
                                >
                                    {isCreatingWorkspace ? <Loader2 size={15} className="settings-spinner" /> : <Plus size={15} />}
                                    <span>{isCreatingWorkspace ? 'Creating' : 'Create Workspace'}</span>
                                </button>
                            </div>
                            <p className="settings-hint">
                                Collaborators can only be invited to a shared workspace, never to your default one.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal-settings-group">
                <h4>PENDING INVITATIONS</h4>
                <div className="pro-settings-stack">
                    {pendingInvitations.length === 0 ? (
                        <div className="pro-settings-item vertical">
                            <div className="pro-settings-text">
                                <label>No pending invitations</label>
                                <p>When another workspace invites this account, the invite will appear here.</p>
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

    const renderWorkspaceDetail = (clinic) => {
        const canManage = ['owner', 'admin'].includes(clinic.membership?.role);
        const isOwner = clinic.membership?.role === 'owner';
        const isDefault = isDefaultWorkspace(clinic, userProfile);
        const removableMembers = (clinic.members || []).filter((member) => member.role !== 'owner');

        return (
            <div className="modal-settings-groups">
                <div className="modal-settings-group">
                    <button className="settings-back-btn" type="button" onClick={() => setSelectedClinicId(null)}>
                        <ArrowLeft size={16} />
                        <span>Back to all workspaces</span>
                    </button>
                </div>

                <div className="modal-settings-group">
                    <h4>WORKSPACE DETAILS</h4>
                    <div className="pro-settings-stack">
                        {error ? <p className="settings-inline-error">{error}</p> : null}
                        {success ? <p className="settings-inline-success">{success}</p> : null}
                        <div className="pro-settings-item vertical">
                            <div className="settings-card-topline">
                                <div className="pro-settings-text">
                                    <label>{getDisplayValue(clinic.name)}</label>
                                    <p>{isDefault ? 'Default workspace' : 'Shared workspace'}.</p>
                                </div>
                                <span className="settings-inline-badge">{isDefault ? 'default' : clinic.membership?.role || 'member'}</span>
                            </div>
                            <div className="settings-meta-grid">
                                <div className="settings-meta-cell">
                                    <span>Workspace Key</span>
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
                                    <label>Workspace Name</label>
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
                            {isDefault ? (
                                <div className="pro-settings-item vertical">
                                    <div className="pro-settings-text">
                                        <label>Collaborators</label>
                                        <p>
                                            Your default workspace is private to your account. Create a shared workspace
                                            to invite other dentists.
                                        </p>
                                    </div>
                                </div>
                            ) : (
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
                            )}
                            {isOwner && !isDefault ? (
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
                            {isDefault ? (
                                <div className="pro-settings-item vertical">
                                    <div className="pro-settings-text">
                                        <label>Delete This Workspace</label>
                                        <p>
                                            The default workspace belongs to your account and is removed only when the
                                            account itself is deleted.
                                        </p>
                                    </div>
                                    <span className="settings-inline-badge">locked</span>
                                </div>
                            ) : (
                                <div className="pro-settings-item">
                                    <div className="pro-settings-text">
                                        <label>Delete This Workspace</label>
                                        <p>This removes only this workspace and the patients linked to it. It does not delete your user account.</p>
                                    </div>
                                    <button
                                        className="pro-btn-danger"
                                        type="button"
                                        disabled={savingClinicId === clinic.id}
                                        onClick={() => handleDeleteClinic(clinic)}
                                    >
                                        Delete Workspace
                                    </button>
                                </div>
                            )}
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
                                    <p>All invitations for this workspace have been accepted or there are none yet.</p>
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

    return selectedClinic ? renderWorkspaceDetail(selectedClinic) : renderWorkspacesList();
};

export default OrganizationsView;
