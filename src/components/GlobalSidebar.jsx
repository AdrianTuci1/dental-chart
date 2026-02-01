import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Settings, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';
import './GlobalSidebar.css';

const GlobalSidebar = () => {
    const logout = useAuthStore((state) => state.logout);

    return (
        <div className="global-sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    D
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `sidebar-nav-link ${isActive ? 'active' : ''}`
                    }
                    title="Home"
                >
                    <Home size={20} />
                </NavLink>

                <NavLink
                    to="/patients"
                    className={({ isActive }) =>
                        `sidebar-nav-link ${isActive ? 'active' : ''}`
                    }
                    title="Patients"
                >
                    <Users size={20} />
                </NavLink>

                <button
                    className="sidebar-settings-btn"
                    title="Settings"
                >
                    <Settings size={20} />
                </button>
            </nav>

            <div className="sidebar-footer">
                <button
                    onClick={() => logout()}
                    className="sidebar-logout-btn"
                    title="Logout"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </div>
    );
};

export default GlobalSidebar;
