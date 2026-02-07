import React, { useState } from 'react';
import { User, Settings, CreditCard, FileText, Shield, Mail, LogOut, X, Moon, Globe, Bell, Key } from 'lucide-react';
import MyProfile from './MyProfile';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
    const [activeView, setActiveView] = useState('profile');

    if (!isOpen) return null;

    const getHeaderInfo = () => {
        switch (activeView) {
            case 'profile': return { title: 'Account Settings' };
            case 'settings': return { title: 'General Settings' };
            case 'billing': return { title: 'Subscription' };
            case 'api': return { title: 'API Configuration' };
            default: return { title: 'Settings' };
        }
    };

    const header = getHeaderInfo();

    const renderContent = () => {
        switch (activeView) {
            case 'profile':
                return <MyProfile />;
            case 'settings':
                return (
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
                                    <select className="modal-settings-select">
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
            case 'api':
                return (
                    <div className="modal-settings-groups">
                        <div className="modal-settings-group">
                            <h4>DEVELOPER API</h4>
                            <div className="pro-settings-stack">
                                <div className="pro-settings-item vertical">
                                    <div className="pro-settings-text">
                                        <label>Secret API Key</label>
                                        <p>Use this key to integrate with third-party dental software.</p>
                                    </div>
                                    <div className="api-key-box">
                                        <input
                                            type="password"
                                            className="api-key-input"
                                            value="sk_live_51P0X_dental_chart_prod_v1"
                                            readOnly
                                        />
                                        <button className="pro-btn-secondary">Copy Key</button>
                                    </div>
                                </div>
                                <div className="pro-settings-item">
                                    <div className="pro-settings-text">
                                        <label>Key Rotation</label>
                                        <p>Regenerate your API key if you suspect it has been compromised.</p>
                                    </div>
                                    <button className="pro-btn-danger">Regenerate</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'billing':
                return (
                    <div className="modal-settings-groups">
                        <div className="modal-settings-group">
                            <h4>CURRENT SUBSCRIPTION</h4>
                            <div className="pro-plan-hero">
                                <div className="pro-plan-info">
                                    <div className="plan-badge-luxe">PROFESSIONAL</div>
                                    <h3>$49.00 <small>/ month</small></h3>
                                    <p>Next billing date: March 12, 2026</p>
                                </div>
                                <button className="pro-btn-primary">Manage Plan</button>
                            </div>

                            <div className="pro-settings-stack" style={{ marginTop: '24px' }}>
                                <div className="pro-settings-item">
                                    <div className="pro-settings-text">
                                        <label>Payment Method</label>
                                        <p>Visa ending in 4242</p>
                                    </div>
                                    <button className="pro-btn-link">Update</button>
                                </div>
                                <div className="pro-settings-item">
                                    <div className="pro-settings-text">
                                        <label>Billing History</label>
                                        <p>View and download your previous invoices.</p>
                                    </div>
                                    <button className="pro-btn-link">View All</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <aside className="modal-sidebar">
                    <div className="sidebar-profile">
                        <div className="sidebar-avatar">
                            <div className="avatar-circle">AT</div>
                        </div>
                        <div className="sidebar-profile-info">
                            <h4>Tucico</h4>
                            <span>adrian.tuci@example.com</span>
                        </div>
                    </div>

                    <div className="sidebar-scroll-area luxe-scroll">
                        <div className="sidebar-section">
                            <h4 className="sidebar-tag">USER SETTINGS</h4>
                            <button
                                className={`sidebar-nav-item ${activeView === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveView('profile')}
                            >
                                <User size={16} />
                                <span>Account Settings</span>
                            </button>
                            <button
                                className={`sidebar-nav-item ${activeView === 'billing' ? 'active' : ''}`}
                                onClick={() => setActiveView('billing')}
                            >
                                <CreditCard size={16} />
                                <span>Subscription</span>
                            </button>
                        </div>

                        <div className="sidebar-section">
                            <h4 className="sidebar-tag">APP SETTINGS</h4>
                            <button
                                className={`sidebar-nav-item ${activeView === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveView('settings')}
                            >
                                <Settings size={16} />
                                <span>General settings</span>
                            </button>
                            <button
                                className={`sidebar-nav-item ${activeView === 'api' ? 'active' : ''}`}
                                onClick={() => setActiveView('api')}
                            >
                                <Key size={16} />
                                <span>API Key</span>
                            </button>
                        </div>

                        <div className="sidebar-section">
                            <h4 className="sidebar-tag">SUPPORT</h4>
                            <button className="sidebar-nav-item">
                                <FileText size={16} />
                                <span>Terms of Service</span>
                            </button>
                            <button className="sidebar-nav-item">
                                <Shield size={16} />
                                <span>Privacy Policy</span>
                            </button>
                            <button className="sidebar-nav-item">
                                <Mail size={16} />
                                <span>Contact Us</span>
                            </button>
                        </div>

                        <div className="sidebar-section mt-auto">
                            <button className="sidebar-nav-item logout">
                                <LogOut size={16} />
                                <span>Log out</span>
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="modal-main">
                    <header className="modal-topbar">
                        <div className="topbar-content">
                            <h2>{header.title}</h2>
                        </div>
                        <button className="modal-close-btn" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </header>

                    <div className="modal-content-area shadow-inner">
                        <div className="modal-content-container luxe-scroll">
                            {renderContent()}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsModal;
