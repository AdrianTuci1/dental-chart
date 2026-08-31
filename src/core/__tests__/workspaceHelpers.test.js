import { describe, it, expect } from 'vitest';
import {
    canInviteMembers,
    findWorkspace,
    getWorkspaces,
    isDefaultWorkspace,
    resolveActiveClinicId,
} from '../workspaces/workspaceHelpers';

const defaultWorkspace = { id: 'c-default', name: "Ada's Clinic", type: 'personal', isDefault: true };
const sharedWorkspace = { id: 'c-shared', name: 'City Dental', type: 'organization', isDefault: false };
const legacyWorkspace = { id: 'c-legacy', name: 'Old Clinic', type: 'personal' };

const profile = {
    id: 'm-1',
    defaultClinicId: 'c-default',
    clinics: [defaultWorkspace, sharedWorkspace],
};

describe('workspaceHelpers', () => {
    it('recognises the default workspace by flag, by type and by the account pointer', () => {
        expect(isDefaultWorkspace(defaultWorkspace, profile)).toBe(true);
        expect(isDefaultWorkspace(sharedWorkspace, profile)).toBe(false);
        expect(isDefaultWorkspace(legacyWorkspace, profile)).toBe(true);
        expect(isDefaultWorkspace({ id: 'c-x', name: 'Other' }, { defaultClinicId: 'c-x' })).toBe(true);
        expect(isDefaultWorkspace(null, profile)).toBe(false);
    });

    it('only allows invitations into shared workspaces', () => {
        expect(canInviteMembers(defaultWorkspace, profile)).toBe(false);
        expect(canInviteMembers(sharedWorkspace, profile)).toBe(true);
    });

    it('treats a missing clinic list as no workspaces', () => {
        expect(getWorkspaces(undefined)).toEqual([]);
        expect(getWorkspaces({ clinics: null })).toEqual([]);
        expect(resolveActiveClinicId({ clinics: [] }, 'c-1')).toBeNull();
    });

    it('keeps a stored selection the account can still access', () => {
        expect(resolveActiveClinicId(profile, 'c-shared')).toBe('c-shared');
    });

    it('falls back to the default workspace when the stored id is stale', () => {
        expect(resolveActiveClinicId(profile, 'deleted-workspace')).toBe('c-default');
        expect(resolveActiveClinicId(profile, null)).toBe('c-default');
    });

    it('falls back to the first workspace when the account has no default pointer', () => {
        expect(resolveActiveClinicId({ clinics: [sharedWorkspace, defaultWorkspace] }, null)).toBe('c-shared');
    });

    it('finds a workspace in the profile', () => {
        expect(findWorkspace(profile, 'c-shared')).toMatchObject({ name: 'City Dental' });
        expect(findWorkspace(profile, 'nope')).toBeNull();
        expect(findWorkspace(profile, null)).toBeNull();
    });
});
