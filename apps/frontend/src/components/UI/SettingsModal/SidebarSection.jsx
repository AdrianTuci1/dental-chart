import React from 'react';

const SidebarSection = ({ tag, items, activeView, onSelect }) => (
    <div className="sidebar-section">
        <h4 className="sidebar-tag">{tag}</h4>
        {items.map(({ id, label, icon: Icon }) => (
            <button
                key={id}
                className={`sidebar-nav-item ${activeView === id ? 'active' : ''}`}
                onClick={() => onSelect(id)}
            >
                <Icon size={16} />
                <span>{label}</span>
            </button>
        ))}
    </div>
);

export default SidebarSection;
