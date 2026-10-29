import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import SidebarSection from './SidebarSection';
import { LOGOUT_ACTION, SIDEBAR_SECTIONS, VIEW_CONFIG } from './navigation';
import ProfileView from './views/ProfileView';
import OrganizationsView from './views/OrganizationsView';
import BillingView from './views/BillingView';
import GeneralSettingsView from './views/GeneralSettingsView';
import ApiAccessView from './views/ApiAccessView';
import SupportView from './views/SupportView';
import { getAvatarColor, getDisplayValue, getInitials } from '../profileUtils';
import { clearClientSession } from '../../../core/session/sessionActions';
import './SettingsModal.css';

const VIEW_COMPONENTS = {
    profile: ProfileView,
    organizations: OrganizationsView,
    billing: BillingView,
    settings: GeneralSettingsView,
    api: ApiAccessView,
    support: SupportView,
};

const SettingsModal = ({ isOpen, onClose, userProfile, onProfileRefresh }) => {
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState('profile');

    if (!isOpen) return null;

    const ActiveView = VIEW_COMPONENTS[activeView] || ProfileView;
    const header = VIEW_CONFIG[activeView] || VIEW_CONFIG.profile;
    const LogoutIcon = LOGOUT_ACTION.icon;
    const avatarSeed = userProfile?.name || userProfile?.email || userProfile?.id;
    const initials = getInitials(userProfile?.name, userProfile?.email);
    const avatarColor = userProfile?.avatarInfo?.color || getAvatarColor(avatarSeed);

    const handleLogout = () => {
        clearClientSession();
        onClose?.();
        navigate('/');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <aside className="modal-sidebar">
                    <div className="sidebar-profile">
                        <div className="sidebar-avatar">
                            <div className="avatar-circle" style={{ backgroundColor: avatarColor }}>
                                {initials}
                            </div>
                        </div>
                        <div className="sidebar-profile-info">
                            <h4>{getDisplayValue(userProfile?.name)}</h4>
                            <span>{getDisplayValue(userProfile?.email)}</span>
                        </div>
                    </div>

                    <div className="sidebar-scroll-area luxe-scroll">
                        {SIDEBAR_SECTIONS.map((section) => (
                            <SidebarSection
                                key={section.tag}
                                tag={section.tag}
                                items={section.items}
                                activeView={activeView}
                                onSelect={setActiveView}
                            />
                        ))}

                        <div className="sidebar-section mt-auto">
                            <button className="sidebar-nav-item logout" type="button" onClick={handleLogout}>
                                <LogoutIcon size={16} />
                                <span>{LOGOUT_ACTION.label}</span>
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="modal-main">
                    <header className="modal-topbar">
                        <div className="topbar-content">
                            <h2>{header.title}</h2>
                        </div>
                        <button className="modal-close-btn" onClick={onClose} type="button">
                            <X size={18} />
                        </button>
                    </header>

                    <div className="modal-content-area shadow-inner">
                        <div className="modal-content-container luxe-scroll">
                            <ActiveView userProfile={userProfile} onProfileRefresh={onProfileRefresh} onClose={onClose} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsModal;
