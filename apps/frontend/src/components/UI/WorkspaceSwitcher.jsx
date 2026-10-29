import React, { useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Loader2, Plus } from 'lucide-react';
import { AppFacade } from '../../core/AppFacade';
import { getWorkspaces, isDefaultWorkspace } from '../../core/workspaces/workspaceHelpers';
import { getDisplayValue } from './profileUtils';
import useDismissableMenu from './useDismissableMenu';
import './WorkspaceSwitcher.css';

const MAX_WORKSPACE_NAME_LENGTH = 60;

const WorkspaceSwitcher = ({ profile, activeClinicId, onSelectWorkspace, onProfileRefresh }) => {
    const containerRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isBusy, setIsBusy] = useState(false);

    const workspaces = getWorkspaces(profile);
    const activeWorkspace = workspaces.find((clinic) => String(clinic.id) === String(activeClinicId)) || null;

    useDismissableMenu(isOpen, () => setIsOpen(false), containerRef);

    const closeMenu = () => {
        setIsOpen(false);
        setIsCreating(false);
        setName('');
        setError('');
    };

    const handleToggle = () => {
        if (isOpen) {
            closeMenu();
            return;
        }
        setIsOpen(true);
    };

    const handleSelect = (clinicId) => {
        closeMenu();
        onSelectWorkspace(clinicId);
    };

    const handleCreate = async (event) => {
        event.preventDefault();

        const trimmed = name.trim();
        if (!trimmed) {
            setError('Give the workspace a name first.');
            return;
        }

        setIsBusy(true);
        setError('');

        try {
            const created = await AppFacade.clinic.create({ name: trimmed });
            await onProfileRefresh?.();
            closeMenu();
            onSelectWorkspace(created.id);
        } catch (createError) {
            setError(createError?.message || 'Could not create the workspace.');
        } finally {
            setIsBusy(false);
        }
    };

    const renderCreateForm = () => (
        <form className="workspace-create-form" onSubmit={handleCreate}>
            <input
                type="text"
                autoFocus
                maxLength={MAX_WORKSPACE_NAME_LENGTH}
                className="workspace-create-input"
                placeholder="Workspace name"
                value={name}
                onChange={(event) => setName(event.target.value)}
            />
            {error ? <p className="workspace-create-error">{error}</p> : null}
            <div className="workspace-create-actions">
                <button
                    type="button"
                    className="workspace-create-cancel"
                    onClick={() => {
                        setIsCreating(false);
                        setName('');
                        setError('');
                    }}
                >
                    Cancel
                </button>
                <button type="submit" className="workspace-create-confirm" disabled={isBusy}>
                    {isBusy ? <Loader2 size={15} className="workspace-create-spinner" /> : null}
                    <span>{isBusy ? 'Creating' : 'Create'}</span>
                </button>
            </div>
        </form>
    );

    return (
        <div className="workspace-switcher" ref={containerRef}>
            <button
                type="button"
                className={`workspace-trigger ${isOpen ? 'active' : ''}`}
                onClick={handleToggle}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                title="Switch workspace"
            >
                <Building2 size={16} className="workspace-trigger-icon" />
                <span className="workspace-trigger-name">
                    {activeWorkspace?.name?.trim() || 'Select workspace'}
                </span>
                <ChevronDown size={16} className={`workspace-trigger-caret ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen ? (
                <div className="workspace-menu" role="menu">
                    <p className="workspace-menu-label">WORKSPACES</p>

                    {workspaces.length === 0 ? (
                        <p className="workspace-menu-empty">No workspace yet. Create one below.</p>
                    ) : null}

                    {workspaces.map((clinic) => {
                        const isActive = String(clinic.id) === String(activeClinicId);
                        const isDefault = isDefaultWorkspace(clinic, profile);

                        return (
                            <button
                                key={clinic.id}
                                type="button"
                                role="menuitemradio"
                                aria-checked={isActive}
                                className={`workspace-menu-item ${isActive ? 'active' : ''}`}
                                onClick={() => handleSelect(clinic.id)}
                            >
                                <span className="workspace-menu-copy">
                                    <strong>{getDisplayValue(clinic.name)}</strong>
                                    <span>
                                        {(clinic.members || []).length} member{(clinic.members || []).length === 1 ? '' : 's'}
                                        {clinic.membership?.role && clinic.membership.role !== 'owner' ? ` · ${clinic.membership.role}` : ''}
                                    </span>
                                </span>
                                {isDefault ? <span className="workspace-menu-badge">Default</span> : null}
                                {isActive ? <Check size={16} className="workspace-menu-check" /> : null}
                            </button>
                        );
                    })}

                    <div className="workspace-menu-divider" />

                    {isCreating ? renderCreateForm() : (
                        <button
                            type="button"
                            className="workspace-menu-new"
                            onClick={() => setIsCreating(true)}
                        >
                            <Plus size={16} />
                            <span>New workspace</span>
                        </button>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default WorkspaceSwitcher;
