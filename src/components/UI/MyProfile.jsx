import React, { useState } from 'react';
import { Mail, Globe, Phone, ShieldCheck, Star, Save, X } from 'lucide-react';

const MyProfile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        name: 'Adrian Tuci',
        title: 'Senior Dental Surgeon',
        bio: 'Dedicated to providing high-quality dental care with over 12 years of experience.',
        email: 'adrian.tuci@example.com',
        phone: '+40 722 000 000',
        location: 'Bucharest Regional Clinic',
        license: 'DS-99021-XPR',
        specialization: 'Oral Surgery & Implants'
    });

    const [editData, setEditData] = useState({ ...profile });

    const handleSave = () => {
        setProfile({ ...editData });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditData({ ...profile });
        setIsEditing(false);
    };

    return (
        <div className="profile-simple">
            <div className="profile-header-simple">
                <div className="profile-avatar-simple">AT</div>
                <div className="profile-intro">
                    <h3>{profile.name}</h3>
                    <p>{profile.title}</p>
                </div>
            </div>

            <div className="modal-settings-groups">
                <div className="modal-settings-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>PUBLIC PROFILE</h4>
                        {!isEditing ? (
                            <button className="pro-btn-link" onClick={() => setIsEditing(true)}>Edit Profile</button>
                        ) : (
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="pro-btn-link" style={{ color: '#10b981' }} onClick={handleSave}>Save</button>
                                <button className="pro-btn-link" style={{ color: '#ff4d4d' }} onClick={handleCancel}>Cancel</button>
                            </div>
                        )}
                    </div>

                    <div className="pro-settings-stack">
                        <div className="pro-settings-item">
                            <div className="pro-settings-text">
                                <label>Full Name</label>
                                {isEditing ? (
                                    <input
                                        className="api-key-input"
                                        style={{ height: '32px', marginTop: '8px' }}
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    />
                                ) : (
                                    <p>{profile.name}</p>
                                )}
                            </div>
                        </div>
                        <div className="pro-settings-item">
                            <div className="pro-settings-text">
                                <label>Email Address</label>
                                {isEditing ? (
                                    <input
                                        className="api-key-input"
                                        style={{ height: '32px', marginTop: '8px' }}
                                        value={editData.email}
                                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                    />
                                ) : (
                                    <p>{profile.email}</p>
                                )}
                            </div>
                        </div>
                        <div className="pro-settings-item">
                            <div className="pro-settings-text">
                                <label>Phone Number</label>
                                {isEditing ? (
                                    <input
                                        className="api-key-input"
                                        style={{ height: '32px', marginTop: '8px' }}
                                        value={editData.phone}
                                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                    />
                                ) : (
                                    <p>{profile.phone}</p>
                                )}
                            </div>
                        </div>
                        <div className="pro-settings-item">
                            <div className="pro-settings-text">
                                <label>Clinical Office</label>
                                {isEditing ? (
                                    <input
                                        className="api-key-input"
                                        style={{ height: '32px', marginTop: '8px' }}
                                        value={editData.location}
                                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                    />
                                ) : (
                                    <p>{profile.location}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-settings-group">
                    <h4>PROFESSIONAL CREDENTIALS</h4>
                    <div className="pro-settings-stack">
                        <div className="pro-settings-item">
                            <div className="pro-settings-text">
                                <label>Medical License</label>
                                <p>{profile.license}</p>
                            </div>
                        </div>
                        <div className="pro-settings-item">
                            <div className="pro-settings-text">
                                <label>Clinical Specialization</label>
                                <p>{profile.specialization}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;
