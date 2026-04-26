import React from 'react';

const BillingView = ({ userProfile }) => {
    const currentPlan = (userProfile?.subscriptionPlan || 'free').toUpperCase();
    const isFreePlan = currentPlan === 'FREE';

    return (
        <div className="modal-settings-groups">
            <div className="modal-settings-group">
                <h4>CURRENT SUBSCRIPTION</h4>
                <div className={`pro-plan-hero ${isFreePlan ? 'is-free' : ''}`}>
                    <div className="pro-plan-info">
                        <div className="plan-badge-luxe">{currentPlan}</div>
                        <h3>{isFreePlan ? '5 Patients' : 'Unlimited'} <small>{isFreePlan ? 'max on free plan' : 'paid account access'}</small></h3>
                        <p>
                            {isFreePlan
                                ? 'Free accounts can create up to 5 owned patients.'
                                : 'Paid accounts can keep creating patients across clinics.'}
                        </p>
                    </div>
                    <button className="pro-btn-primary" type="button">Manage Plan</button>
                </div>

                <div className="pro-settings-stack" style={{ marginTop: '24px' }}>
                    <div className="pro-settings-item">
                        <div className="pro-settings-text">
                            <label>Account Tier</label>
                            <p>{isFreePlan ? 'Starter access with patient limit enforcement.' : 'Expanded access with higher operational capacity.'}</p>
                        </div>
                        <span className="settings-inline-badge">{currentPlan}</span>
                    </div>
                    <div className="pro-settings-item">
                        <div className="pro-settings-text">
                            <label>Clinic Collaboration</label>
                            <p>Members of the same clinic can view the same patient list.</p>
                        </div>
                        <span className="settings-inline-badge">Enabled</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingView;
