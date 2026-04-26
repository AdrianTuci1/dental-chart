import React, { useMemo, useState } from 'react';
import { AppFacade } from '../../../../core/AppFacade';

const ApiAccessView = ({ userProfile }) => {
    const [copied, setCopied] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [rotationError, setRotationError] = useState('');
    const [newApiKey, setNewApiKey] = useState('');
    const apiKey = newApiKey || userProfile?.apiKey || userProfile?.apiKeyMasked || '';
    const hasApiKey = Boolean(apiKey);
    const docsUrl = useMemo(() => {
        const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
        return `${apiBaseUrl}/docs`;
    }, []);
    const helperText = useMemo(() => {
        if (newApiKey) {
            return 'This is the new API key. It is only shown once after rotation, so save it in your integration now.';
        }

        return 'Use this key for the external patient contract API. Supported patient fields: id, name, dateOfBirth, gender, phone, email.';
    }, [newApiKey]);

    const formatDate = (value) => {
        if (!value) return 'Never';
        return new Date(value).toLocaleString();
    };

    const handleCopy = async () => {
        if (!hasApiKey) {
            return;
        }

        try {
            await navigator.clipboard.writeText(apiKey);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch (error) {
            console.error('Failed to copy API key', error);
        }
    };

    const handleRotate = async () => {
        if (!userProfile?.id || isRotating) {
            return;
        }

        setRotationError('');
        setCopied(false);
        setIsRotating(true);

        try {
            const rotatedProfile = await AppFacade.medic.rotateApiKey(userProfile.id);
            setNewApiKey(rotatedProfile?.apiKey || '');
        } catch (error) {
            setRotationError(error?.message || 'Failed to rotate API key.');
        } finally {
            setIsRotating(false);
        }
    };

    return (
        <div className="modal-settings-groups">
            <div className="modal-settings-group">
                <h4>DEVELOPER API</h4>
                <div className="pro-settings-stack">
                    <div className="pro-settings-item vertical">
                        <div className="pro-settings-text">
                            <label>Secret API Key</label>
                            <p>{helperText}</p>
                        </div>
                        <div className="api-key-box">
                            <input
                                type={newApiKey ? 'text' : 'password'}
                                className="api-key-input"
                                value={apiKey || 'No API key available yet'}
                                readOnly
                            />
                            <button className="pro-btn-secondary" type="button" onClick={handleCopy} disabled={!hasApiKey}>
                                {copied ? 'Copied' : 'Copy Key'}
                            </button>
                        </div>
                        {rotationError ? (
                            <p className="settings-inline-error" role="alert">{rotationError}</p>
                        ) : null}
                    </div>
                    <div className="pro-settings-item">
                        <div className="pro-settings-text">
                            <label>OpenAPI Docs</label>
                            <p>The backend exposes the live contract documentation for this environment.</p>
                        </div>
                        <a
                            className="settings-inline-badge settings-inline-link"
                            href={docsUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Open Docs
                        </a>
                    </div>
                    <div className="pro-settings-item">
                        <div className="pro-settings-text">
                            <label>Usage Metadata</label>
                            <p>Track when the key was last rotated and when it was last used by an external integration.</p>
                        </div>
                        <div className="pro-settings-meta">
                            <span>Rotated: {formatDate(userProfile?.apiKeyLastRotatedAt)}</span>
                            <span>Last used: {formatDate(userProfile?.apiKeyLastUsedAt)}</span>
                        </div>
                    </div>
                    <div className="pro-settings-item">
                        <div className="pro-settings-text">
                            <label>Key Rotation</label>
                            <p>Rotate the API key when you want to invalidate older integrations. Existing API clients will stop working immediately.</p>
                        </div>
                        <button className="pro-btn-danger" type="button" onClick={handleRotate} disabled={isRotating || !userProfile?.id}>
                            {isRotating ? 'Rotating...' : 'Rotate Key'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiAccessView;
