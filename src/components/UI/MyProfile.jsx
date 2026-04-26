import React, { useEffect, useMemo, useState } from 'react';
import { AppFacade } from '../../core/AppFacade';
import { getAvatarColor, getDisplayValue, getInitials } from './profileUtils';

const EDITABLE_FIELDS = [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
    { key: 'phone', label: 'Phone Number', type: 'text' },
    { key: 'location', label: 'Clinical Office', type: 'text' },
    { key: 'license', label: 'Medical License', type: 'text' },
    { key: 'specialization', label: 'Clinical Specialization', type: 'text' },
];

const MyProfile = ({ initialProfile, onProfileRefresh }) => {
    const profile = initialProfile || {};
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({});

    useEffect(() => {
        setFormData({
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            license: profile.license || '',
            specialization: profile.specialization || '',
        });
    }, [profile]);

    const avatarSeed = profile?.name || profile?.email || profile?.id;
    const initials = getInitials(profile?.name, profile?.email);
    const avatarColor = profile?.avatarInfo?.color || getAvatarColor(avatarSeed);

    const groupedFields = useMemo(() => ({
        public: EDITABLE_FIELDS.slice(0, 4),
        credentials: EDITABLE_FIELDS.slice(4),
    }), []);

    const handleChange = (field, value) => {
        setFormData((current) => ({
            ...current,
            [field]: value,
        }));
        setError('');
        setSuccess('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError('');
        setSuccess('');
        setFormData({
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            license: profile.license || '',
            specialization: profile.specialization || '',
        });
    };

    const handleSave = async () => {
        if (!profile?.id) {
            setError('Profile is not ready yet.');
            return;
        }

        if (!formData.name?.trim()) {
            setError('Full name is required.');
            return;
        }

        if (!formData.email?.trim()) {
            setError('Email address is required.');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            await AppFacade.medic.updateProfile(profile.id, formData);
            if (typeof onProfileRefresh === 'function') {
                await onProfileRefresh();
            }
            setIsEditing(false);
            setSuccess('Profile updated.');
        } catch (saveError) {
            setError(saveError?.message || 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderField = (field) => (
        <div className="pro-settings-item" key={field.key}>
            <div className="pro-settings-text">
                <label>{field.label}</label>
                {isEditing ? (
                    <input
                        type={field.type}
                        className="api-key-input settings-text-input"
                        value={formData[field.key] || ''}
                        onChange={(event) => handleChange(field.key, event.target.value)}
                    />
                ) : (
                    <p>{getDisplayValue(profile[field.key])}</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="profile-simple">
            <div className="profile-header-simple">
                <div
                    className="profile-avatar-simple"
                    style={{ backgroundColor: avatarColor, width: '40px', height: '40px', justifyContent: 'center', alignItems: 'center', display: 'flex' }}
                >
                    {initials}
                </div>
            </div>

            <div className="modal-settings-groups">
                <div className="modal-settings-group">
                    <div className="settings-section-header">
                        <h4 style={{ margin: 0 }}>PUBLIC PROFILE</h4>
                        {isEditing ? (
                            <div className="settings-header-actions">
                                <button className="pro-btn-secondary" type="button" onClick={handleCancel} disabled={isSaving}>
                                    Cancel
                                </button>
                                <button className="pro-btn-primary" type="button" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        ) : (
                            <button className="pro-btn-link" type="button" onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <div className="pro-settings-stack">
                        {error ? <p className="settings-inline-error">{error}</p> : null}
                        {success ? <p className="settings-inline-success">{success}</p> : null}
                        {groupedFields.public.map(renderField)}
                    </div>
                </div>

                <div className="modal-settings-group">
                    <h4>PROFESSIONAL CREDENTIALS</h4>
                    <div className="pro-settings-stack">
                        {groupedFields.credentials.map(renderField)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;
