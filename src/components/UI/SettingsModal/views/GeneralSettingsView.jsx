import React from 'react';

const GeneralSettingsView = () => (
    <div className="modal-settings-groups">
        <div className="modal-settings-group">
            <h4>PREFERENCES</h4>
            <div className="pro-settings-stack">
                <div className="pro-settings-item">
                    <div className="pro-settings-text">
                        <label>Interface Theme</label>
                        <p>Choose between light and dark mode for your workspace.</p>
                    </div>
                    <div className="modal-toggle-switch-dummy active" />
                </div>
                <div className="pro-settings-item">
                    <div className="pro-settings-text">
                        <label>Language</label>
                        <p>Select the default language for the interface and patient reports.</p>
                    </div>
                    <select className="modal-settings-select" defaultValue="English (US)">
                        <option>English (US)</option>
                        <option>Romanian (RO)</option>
                    </select>
                </div>
                <div className="pro-settings-item">
                    <div className="pro-settings-text">
                        <label>Email Notifications</label>
                        <p>Get notified about important patient updates and system alerts.</p>
                    </div>
                    <div className="modal-toggle-switch-dummy active" />
                </div>
            </div>
        </div>
    </div>
);

export default GeneralSettingsView;
