import React, { useState } from 'react';

const ApiAccessView = ({ userProfile }) => {
    const [copied, setCopied] = useState(false);
    const apiKey = userProfile?.apiKey || userProfile?.apiKeyMasked || 'No API key available yet';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(apiKey);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch (error) {
            console.error('Failed to copy API key', error);
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
                            <p>Use this key for the external patient contract API. Supported patient fields: id, name, dateOfBirth, gender, phone, email.</p>
                        </div>
                        <div className="api-key-box">
                            <input
                                type="password"
                                className="api-key-input"
                                value={apiKey}
                                readOnly
                            />
                            <button className="pro-btn-secondary" type="button" onClick={handleCopy}>
                                {copied ? 'Copied' : 'Copy Key'}
                            </button>
                        </div>
                    </div>
                    <div className="pro-settings-item">
                        <div className="pro-settings-text">
                            <label>OpenAPI Docs</label>
                            <p>The backend now exposes the contract spec at <code>/docs</code>.</p>
                        </div>
                        <span className="settings-inline-badge">/docs</span>
                    </div>
                    <div className="pro-settings-item">
                        <div className="pro-settings-text">
                            <label>Key Rotation</label>
                            <p>Rotate the API key from the backend route when you want to invalidate older integrations.</p>
                        </div>
                        <button className="pro-btn-danger" type="button">Rotate on Server</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiAccessView;
