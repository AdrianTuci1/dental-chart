/**
 * Workspace helpers. In the API a workspace is still called a "clinic":
 * the account's default workspace is its personal clinic, additional ones are shared.
 */

export const isDefaultWorkspace = (clinic, medic = null) => {
    if (!clinic) {
        return false;
    }

    if (clinic.isDefault === true || clinic.type === 'personal') {
        return true;
    }

    return Boolean(medic?.defaultClinicId) && String(medic.defaultClinicId) === String(clinic.id);
};

export const getWorkspaces = (profile) => (Array.isArray(profile?.clinics) ? profile.clinics : []);

/**
 * The stored selection wins as long as the medic can still access it; otherwise the
 * account falls back to its default workspace.
 */
export const resolveActiveClinicId = (profile, storedClinicId = null) => {
    const workspaces = getWorkspaces(profile);
    if (!workspaces.length) {
        return null;
    }

    const stored = workspaces.find((clinic) => String(clinic.id) === String(storedClinicId));
    if (stored) {
        return stored.id;
    }

    const defaultWorkspace = workspaces.find((clinic) => String(clinic.id) === String(profile?.defaultClinicId));
    if (defaultWorkspace) {
        return defaultWorkspace.id;
    }

    return workspaces[0].id;
};

export const findWorkspace = (profile, clinicId) => {
    if (!clinicId) {
        return null;
    }

    return getWorkspaces(profile).find((clinic) => String(clinic.id) === String(clinicId)) || null;
};

export const canInviteMembers = (clinic, medic = null) => !isDefaultWorkspace(clinic, medic);
