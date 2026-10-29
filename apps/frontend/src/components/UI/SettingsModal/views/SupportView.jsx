import React from 'react';
import { SUPPORT_LINKS } from '../navigation';

const SupportView = () => (
    <div className="modal-settings-groups">
        <div className="modal-settings-group">
            <h4>SUPPORT & LEGAL</h4>
            <div className="pro-settings-stack">
                {SUPPORT_LINKS.map(({ label, icon: Icon }) => (
                    <button className="sidebar-nav-item settings-support-item" key={label} type="button">
                        <Icon size={16} />
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        </div>
    </div>
);

export default SupportView;
