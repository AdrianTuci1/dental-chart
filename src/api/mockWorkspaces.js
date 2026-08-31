/**
 * Dev-mode stand-in for the workspace endpoints (VITE_DEV_MODE=true), so the UI can be
 * exercised without the API. It mirrors the server rules: every account owns exactly one
 * default workspace which cannot be deleted or shared with collaborators.
 */

const STORAGE_KEY = 'dchart.mockWorkspaces.v1';

const readState = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

const writeState = (state) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Storage unavailable: the session keeps working from an empty state.
    }
};

const buildId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const buildDisplayId = (name) => {
    const prefix = String(name || 'WSR')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 3)
        .padEnd(3, 'X');
    return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
};

const ownerMembership = (medic) => ({
    medicId: medic.id,
    name: medic.name,
    email: medic.email,
    role: 'owner',
    status: 'active',
    joinedAt: new Date().toISOString(),
});

const defaultWorkspace = (medic) => ({
    id: `clinic-default-${medic.id}`,
    name: `${medic.name || 'My'}'s Clinic`,
    displayId: buildDisplayId(medic.name || 'CLN'),
    type: 'personal',
    isDefault: true,
    ownerMedicId: medic.id,
    ownerName: medic.name,
    ownerEmail: medic.email,
    members: [ownerMembership(medic)],
    invitations: [],
    membership: { role: 'owner', status: 'active' },
});

const isDefault = (workspace) => workspace.isDefault === true || workspace.type === 'personal';

const findWorkspace = (workspaces, clinicId) => workspaces.find((workspace) => String(workspace.id) === String(clinicId));

const loadWorkspaces = (medic) => {
    const state = readState();

    if (!Array.isArray(state[medic.id]?.workspaces) || !state[medic.id].workspaces.length) {
        state[medic.id] = { workspaces: [defaultWorkspace(medic)] };
        writeState(state);
    }

    return state[medic.id].workspaces;
};

const saveWorkspaces = (medic, workspaces) => {
    const state = readState();
    state[medic.id] = { workspaces };
    writeState(state);
};

export const getWorkspaceProfileFields = (medic) => {
    const workspaces = loadWorkspaces(medic);
    const defaultWorkspaceRecord = workspaces.find(isDefault) || workspaces[0];

    return {
        clinics: workspaces,
        defaultClinicId: defaultWorkspaceRecord?.id || null,
        pendingInvitations: [],
    };
};

export const createMockWorkspace = (medic, payload = {}) => {
    const name = String(payload.name || '').trim();
    if (!name) {
        throw new Error('Clinic name is required');
    }

    const workspaces = loadWorkspaces(medic);
    const workspace = {
        id: buildId('clinic'),
        name,
        displayId: buildDisplayId(name),
        type: 'organization',
        isDefault: false,
        ownerMedicId: medic.id,
        ownerName: medic.name,
        ownerEmail: medic.email,
        members: [ownerMembership(medic)],
        invitations: [],
        membership: { role: 'owner', status: 'active' },
    };

    saveWorkspaces(medic, [...workspaces, workspace]);
    return workspace;
};

export const updateMockWorkspace = (medic, clinicId, payload = {}) => {
    const workspaces = loadWorkspaces(medic);
    const workspace = findWorkspace(workspaces, clinicId);

    if (!workspace) {
        throw new Error('Clinic not found');
    }

    if (payload.name) {
        workspace.name = String(payload.name).trim();
        workspace.displayId = workspace.displayId || buildDisplayId(workspace.name);
    }

    saveWorkspaces(medic, workspaces);
    return workspace;
};

export const deleteMockWorkspace = (medic, clinicId) => {
    const workspaces = loadWorkspaces(medic);
    const workspace = findWorkspace(workspaces, clinicId);

    if (!workspace) {
        throw new Error('Clinic not found');
    }

    if (isDefault(workspace)) {
        throw new Error('The default workspace can only be removed together with the account');
    }

    saveWorkspaces(medic, workspaces.filter((entry) => entry.id !== workspace.id));
    return { deleted: true, clinicId };
};

export const inviteMockMember = (medic, clinicId, payload = {}) => {
    const workspaces = loadWorkspaces(medic);
    const workspace = findWorkspace(workspaces, clinicId);

    if (!workspace) {
        throw new Error('Clinic not found');
    }

    if (isDefault(workspace)) {
        throw new Error('Collaborators can only be invited to a shared workspace');
    }

    const invitation = {
        id: buildId('invite'),
        clinicId,
        invitedEmail: payload.invitedEmail,
        invitedByMedicId: medic.id,
        role: payload.role || 'member',
        status: 'pending',
    };

    workspace.invitations = [...(workspace.invitations || []), invitation];
    saveWorkspaces(medic, workspaces);
    return invitation;
};

const workspaceProfileDefaultId = (medic) => {
    const workspaces = loadWorkspaces(medic);
    return (workspaces.find(isDefault) || workspaces[0])?.id || null;
};

/**
 * Patients without an explicit workspace belong to the default one, matching the
 * server-side migration of pre-workspace records.
 */
export const filterMockPatients = (medic, patients = [], clinicId) => {
    if (!clinicId) {
        return patients;
    }

    const workspaces = loadWorkspaces(medic);
    const workspace = findWorkspace(workspaces, clinicId);
    if (!workspace) {
        throw new Error('Medic does not have access to the selected clinic');
    }

    return patients.filter((patient) => (patient.clinicId || workspaceProfileDefaultId(medic)) === clinicId);
};
