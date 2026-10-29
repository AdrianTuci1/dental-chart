import React, { useCallback, useEffect, useState } from 'react';
import { systemService } from '../../../../api';

const StatusBadge = ({ active, children }) => (
    <span className={`settings-inline-badge ${active ? 'is-on' : 'is-off'}`}>{children}</span>
);

const StatusRow = ({ label, description, active, badge }) => (
    <div className="pro-settings-item">
        <div className="pro-settings-text">
            <label>{label}</label>
            <p>{description}</p>
        </div>
        <StatusBadge active={active}>{badge}</StatusBadge>
    </div>
);

const databaseDescription = (database) => {
    if (database.driver === 'postgres') {
        const target = database.target || {};

        if (!target.configured) {
            return 'DATABASE_URL is missing. Set it and restart the API.';
        }

        return `${target.host || 'unknown host'} / ${target.database || 'unknown database'}${target.ssl ? ' (SSL)' : ''}`;
    }

    return `Table ${database.tableName} in ${database.region || 'the configured AWS region'}`;
};

const SystemView = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState('');

    const loadConfig = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            setConfig(await systemService.getConfig());
        } catch (loadError) {
            setError(loadError?.message || 'Could not load the system configuration.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleTestEmail = async () => {
        if (sending) return;

        setSending(true);
        setTestResult(null);
        setTestError('');

        try {
            setTestResult(await systemService.sendTestEmail());
        } catch (sendError) {
            setTestError(sendError?.message || 'The test email request failed.');
        } finally {
            setSending(false);
        }
    };

    if (loading && !config) {
        return (
            <div className="modal-settings-groups">
                <div className="modal-settings-group">
                    <h4>SYSTEM</h4>
                    <div className="pro-settings-stack">
                        <div className="pro-settings-item">
                            <div className="pro-settings-text">
                                <label>Loading configuration...</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !config) {
        return (
            <div className="modal-settings-groups">
                <div className="modal-settings-group">
                    <h4>SYSTEM</h4>
                    <div className="pro-settings-stack">
                        <div className="pro-settings-item vertical">
                            <p className="settings-inline-error" role="alert">{error}</p>
                            <button className="pro-btn-secondary" type="button" onClick={loadConfig}>
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const email = config.email;
    const emailDetail = email.configured
        ? `${email.provider}${email.from ? ` · ${email.from}` : ''}`
        : (email.detail || 'No email provider is configured.');

    return (
        <div className="modal-settings-groups">
            {error ? (
                <div className="modal-settings-group">
                    <p className="settings-inline-error" role="alert">{error}</p>
                </div>
            ) : null}

            <div className="modal-settings-group">
                <h4>DATABASE</h4>
                <div className="pro-settings-stack">
                    <StatusRow
                        label={config.database.driver === 'postgres' ? 'PostgreSQL' : 'DynamoDB'}
                        description={databaseDescription(config.database)}
                        active
                        badge={config.database.driver}
                    />
                </div>
            </div>

            <div className="modal-settings-group">
                <h4>EMAIL DELIVERY</h4>
                <div className="pro-settings-stack">
                    <StatusRow
                        label="Outbound email"
                        description={emailDetail}
                        active={email.configured}
                        badge={email.configured ? email.provider : 'inactive'}
                    />
                    <div className="pro-settings-item vertical">
                        <div className="pro-settings-text">
                            <label>Send a test message</label>
                            <p>
                                The message goes to the address on your account. A missing provider
                                leaves the API and the rest of the app working.
                            </p>
                        </div>
                        <button
                            className="pro-btn-secondary"
                            type="button"
                            onClick={handleTestEmail}
                            disabled={sending}
                        >
                            {sending ? 'Sending...' : 'Send test email'}
                        </button>
                        {testResult ? (
                            <p
                                className={testResult.delivered ? 'settings-inline-success' : 'settings-inline-error'}
                                role="status"
                            >
                                {testResult.delivered
                                    ? `Test email sent to ${testResult.to}.`
                                    : `Not delivered (${testResult.reason}): ${testResult.detail || 'no detail reported'}`}
                            </p>
                        ) : null}
                        {testError ? (
                            <p className="settings-inline-error" role="alert">{testError}</p>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="modal-settings-group">
                <h4>INTEGRATIONS</h4>
                <div className="pro-settings-stack">
                    <StatusRow
                        label="Google sign-in"
                        description={config.google.configured
                            ? 'GOOGLE_CLIENT_ID is set and the server can verify Google tokens.'
                            : 'GOOGLE_CLIENT_ID is not set, so the Google button stays hidden.'}
                        active={config.google.configured}
                        badge={config.google.configured ? 'configured' : 'inactive'}
                    />
                    <StatusRow
                        label="Billing"
                        description={config.billing?.configured
                            ? `Stripe · $${config.billing.prices?.month ?? 30}/month or $${config.billing.prices?.year ?? 300}/year.`
                            : 'Stripe keys are not configured, so subscriptions are unavailable.'}
                        active={Boolean(config.billing?.configured)}
                        badge={config.billing?.configured ? 'enabled' : 'disabled'}
                    />
                    <StatusRow
                        label="AI X-ray analysis"
                        description={config.ai.enabled
                            ? 'Analysis is enabled for this deployment.'
                            : 'Analysis is disabled; the app keeps its fallback detections.'}
                        active={config.ai.enabled}
                        badge={config.ai.enabled ? 'enabled' : 'disabled'}
                    />
                </div>
            </div>

            <div className="modal-settings-group">
                <h4>SECURITY & RUNTIME</h4>
                <div className="pro-settings-stack">
                    <StatusRow
                        label="Access token secret"
                        description={`Lifetime ${config.auth.accessTokenLifetime}.`}
                        active={config.auth.jwtSecretConfigured}
                        badge={config.auth.jwtSecretConfigured ? 'set' : 'missing'}
                    />
                    <StatusRow
                        label="Refresh token secret"
                        description={`Sliding window ${config.auth.refreshTokenLifetime}.`}
                        active={config.auth.refreshTokenSecretConfigured}
                        badge={config.auth.refreshTokenSecretConfigured ? 'set' : 'missing'}
                    />
                    <StatusRow
                        label="Environment"
                        description={config.runtime.corsOrigins?.length
                            ? `CORS allows ${config.runtime.corsOrigins.join(', ')}`
                            : 'CORS uses the built-in local and app.pixtooth.com origins.'}
                        active
                        badge={config.runtime.environment}
                    />
                </div>
            </div>

            {config.warnings?.length ? (
                <div className="modal-settings-group">
                    <h4>WARNINGS</h4>
                    <div className="pro-settings-stack">
                        {config.warnings.map((warning) => (
                            <div className="pro-settings-item" key={warning}>
                                <div className="pro-settings-text">
                                    <p>{warning}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default SystemView;
