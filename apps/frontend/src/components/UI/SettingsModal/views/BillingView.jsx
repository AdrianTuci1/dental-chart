import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, CreditCard, ExternalLink } from 'lucide-react';
import { billingService } from '../../../../api';

const money = (amount, currency) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(currency || 'usd').toUpperCase(),
    maximumFractionDigits: 0,
}).format(amount);

const formatDate = (value) => {
    if (!value) return null;

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(value));
};

const statusLabel = (status) => {
    switch (status) {
        case 'active': return 'Active';
        case 'trialing': return 'Trial';
        case 'past_due': return 'Payment failed';
        case 'unpaid': return 'Unpaid';
        case 'canceled': return 'Canceled';
        case 'paused': return 'Paused';
        default: return 'Not subscribed';
    }
};

const BillingView = ({ userProfile, onProfileRefresh }) => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [redirecting, setRedirecting] = useState(null);

    const loadStatus = useCallback(async () => {
        try {
            setError(null);
            setStatus(await billingService.getStatus());
        } catch (requestError) {
            setError(requestError.message || 'Could not load the subscription');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const result = params.get('billing');

        if (result === 'success') {
            // The webhook normally lands before the redirect, but a slow event should
            // not leave the screen showing the old plan.
            loadStatus();
            onProfileRefresh?.();
        }
    }, [loadStatus, onProfileRefresh]);

    const startCheckout = async (interval) => {
        setRedirecting(interval);
        setError(null);

        try {
            const { url } = await billingService.createCheckout(interval);
            window.location.assign(url);
        } catch (requestError) {
            setError(requestError.message || 'Could not start checkout');
            setRedirecting(null);
        }
    };

    const openPortal = async () => {
        setRedirecting('portal');
        setError(null);

        try {
            const { url } = await billingService.createPortal();
            window.location.assign(url);
        } catch (requestError) {
            setError(requestError.message || 'Could not open the billing portal');
            setRedirecting(null);
        }
    };

    if (loading) {
        return <div className="billing-state">Loading subscription…</div>;
    }

    const plan = (status?.plan || userProfile?.subscriptionPlan || 'free').toUpperCase();
    const licensed = Boolean(status?.licensed);
    const prices = status?.prices || { month: 30, year: 300 };
    const currency = status?.currency || 'usd';
    const renewal = formatDate(status?.currentPeriodEnd);

    return (
        <div className="modal-settings-groups">
            <div className="modal-settings-group">
                <h4>CURRENT SUBSCRIPTION</h4>

                <div className={`pro-plan-hero ${licensed ? '' : 'is-free'}`}>
                    <div className="pro-plan-info">
                        <div className="plan-badge-luxe">{plan}</div>
                        <h3>
                            {licensed ? 'Unlimited patients' : '5 patients per workspace'}
                            <small>{licensed ? 'license active' : 'free plan'}</small>
                        </h3>
                        <p>
                            {licensed
                                ? 'Your license removes the patient cap in your personal workspace and for members of the workspaces you own.'
                                : 'Upgrade to remove the patient cap for your organization. Personal workspaces of members keep the 5-patient limit.'}
                        </p>
                    </div>

                    <div className="billing-status-pill">
                        <span className={`billing-dot ${licensed ? 'is-active' : ''}`} />
                        {statusLabel(status?.status)}
                    </div>
                </div>

                {error && (
                    <div className="billing-message is-error" role="alert">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {!status?.enabled && (
                    <div className="billing-message">
                        <AlertCircle size={16} />
                        <span>Billing is not configured on this deployment.</span>
                    </div>
                )}

                {licensed ? (
                    <div className="billing-license-card">
                        <div>
                            <strong>{plan} license</strong>
                            <p>
                                {status?.interval === 'year'
                                    ? 'Billed yearly'
                                    : (status?.interval === 'month' ? 'Billed monthly' : 'License active')}
                                {renewal ? ` · renews ${renewal}` : ''}
                                {status?.cancelAtPeriodEnd ? ' · cancels at the end of the period' : ''}
                            </p>
                        </div>
                        <button
                            className="pro-btn-secondary"
                            type="button"
                            disabled={!status?.portalAvailable || redirecting === 'portal'}
                            onClick={openPortal}
                        >
                            <ExternalLink size={15} />
                            {redirecting === 'portal' ? 'Opening…' : 'Manage billing'}
                        </button>
                    </div>
                ) : (
                    <div className="billing-plans">
                        <div className="billing-plan">
                            <span className="billing-plan-label">Monthly</span>
                            <strong className="billing-price">{money(prices.month, currency)}</strong>
                            <span className="billing-plan-period">per month</span>
                            <ul>
                                <li><Check size={14} /> Unlimited patients</li>
                                <li><Check size={14} /> Organization-wide license</li>
                                <li><Check size={14} /> Cancel anytime</li>
                            </ul>
                            <button
                                className="pro-btn-secondary"
                                type="button"
                                disabled={!status?.enabled || Boolean(redirecting)}
                                onClick={() => startCheckout('month')}
                            >
                                {redirecting === 'month' ? 'Opening…' : 'Choose monthly'}
                            </button>
                        </div>

                        <div className="billing-plan is-featured">
                            <span className="billing-plan-label">Yearly · save {money(prices.month * 12 - prices.year, currency)}</span>
                            <strong className="billing-price">{money(prices.year, currency)}</strong>
                            <span className="billing-plan-period">per year</span>
                            <ul>
                                <li><Check size={14} /> Unlimited patients</li>
                                <li><Check size={14} /> Organization-wide license</li>
                                <li><Check size={14} /> Two months free</li>
                            </ul>
                            <button
                                className="pro-btn-primary"
                                type="button"
                                disabled={!status?.enabled || Boolean(redirecting)}
                                onClick={() => startCheckout('year')}
                            >
                                {redirecting === 'year' ? 'Opening…' : 'Choose yearly'}
                            </button>
                        </div>
                    </div>
                )}

                {status?.enabled && status?.portalAvailable && (
                    <button
                        className="pro-btn-link billing-refresh"
                        type="button"
                        onClick={loadStatus}
                    >
                        Refresh status
                    </button>
                )}

                <div className="pro-settings-stack" style={{ marginTop: '24px' }}>
                    <div className="pro-settings-item">
                        <div className="pro-settings-text">
                            <label>What the license covers</label>
                            <p>
                                The licensed account keeps unlimited patients in its personal workspace.
                                Members of the organizations it owns also lose the cap in those shared
                                workspaces. Their own personal workspaces stay limited to 5 patients.
                            </p>
                        </div>
                        <CreditCard size={18} />
                    </div>
                    <div className="pro-settings-item">
                        <div className="pro-settings-text">
                            <label>Payments</label>
                            <p>Card details are entered on Stripe. Pixtooth never stores them.</p>
                        </div>
                        <span className="settings-inline-badge">Stripe</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingView;
