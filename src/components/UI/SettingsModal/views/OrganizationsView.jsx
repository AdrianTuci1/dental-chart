import React from 'react';

const OrganizationsView = ({ userProfile }) => {
    const clinics = userProfile?.clinics || [];

    return (
        <div className="modal-settings-groups">
            <div className="modal-settings-group">
                <h4>CLINICS</h4>
                <div className="pro-settings-stack">
                    {clinics.length === 0 && (
                        <div className="pro-settings-item vertical">
                            <div className="pro-settings-text">
                                <label>No linked clinics yet</label>
                                <p>Each account can belong to multiple clinics. Once invited, all members of the same clinic can see that clinic&apos;s patients.</p>
                            </div>
                        </div>
                    )}

                    {clinics.map((clinic) => (
                        <div className="pro-settings-item vertical" key={clinic.id}>
                            <div className="settings-card-topline">
                                <div className="pro-settings-text">
                                    <label>{clinic.name}</label>
                                    <p>{clinic.type === 'personal' ? 'Personal clinic' : 'Shared organization'} with role {clinic.membership?.role || 'member'}.</p>
                                </div>
                                <span className="settings-inline-badge">{clinic.membership?.role || 'member'}</span>
                            </div>
                            <div className="settings-meta-grid">
                                <div className="settings-meta-cell">
                                    <span>Clinic ID</span>
                                    <strong>{clinic.id}</strong>
                                </div>
                                <div className="settings-meta-cell">
                                    <span>Owner</span>
                                    <strong>{clinic.ownerMedicId || 'n/a'}</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="modal-settings-group">
                <h4>HOW ACCESS WORKS</h4>
                <div className="pro-settings-stack">
                    <div className="pro-settings-item">
                        <div className="pro-settings-text">
                            <label>Shared Visibility</label>
                            <p>Every active member in a clinic can see patients from that clinic.</p>
                        </div>
                    </div>
                    <div className="pro-settings-item">
                        <div className="pro-settings-text">
                            <label>Ownership Transfer</label>
                            <p>If an owner account is removed, clinic ownership should be transferred before deletion when other members still exist.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationsView;
