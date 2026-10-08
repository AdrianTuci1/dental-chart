import React, { useRef, useState } from 'react';
import { CircleUser, LogOut, Settings } from 'lucide-react';
import useDismissableMenu from './useDismissableMenu';
import { getDisplayValue } from './profileUtils';
import './AccountMenu.css';

const AccountMenu = ({ profile, onOpenSettings, onSignOut }) => {
    const containerRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);

    useDismissableMenu(isOpen, () => setIsOpen(false), containerRef);

    const runAction = (action) => {
        setIsOpen(false);
        action?.();
    };

    return (
        <div className="account-menu" ref={containerRef}>
            <button
                type="button"
                className={`account-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                title={profile?.name || 'Account'}
            >
                <CircleUser size={26} />
            </button>

            {isOpen ? (
                <div className="account-dropdown" role="menu">
                    <div className="account-dropdown-header">
                        <strong>{getDisplayValue(profile?.name)}</strong>
                        <span>{getDisplayValue(profile?.email)}</span>
                    </div>

                    <button
                        type="button"
                        role="menuitem"
                        className="account-dropdown-item"
                        onClick={() => runAction(onOpenSettings)}
                    >
                        <Settings size={16} />
                        <span>Settings</span>
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        className="account-dropdown-item sign-out"
                        onClick={() => runAction(onSignOut)}
                    >
                        <LogOut size={16} />
                        <span>Sign out</span>
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default AccountMenu;
