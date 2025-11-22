import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Settings, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';

const GlobalSidebar = () => {
    const logout = useAuthStore((state) => state.logout);

    return (
        <div className="w-[54px] bg-[var(--color-primary-dark)] h-screen fixed left-0 top-0 flex flex-col items-center py-4 text-white z-50 shadow-lg">
            <div className="mb-8">
                <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-[var(--color-primary)] font-bold text-xl">
                    D
                </div>
            </div>

            <nav className="flex-1 flex flex-col gap-4 w-full items-center">
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `p-2 rounded-md transition-colors ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`
                    }
                    title="Home"
                >
                    <Home size={20} />
                </NavLink>

                <NavLink
                    to="/patients"
                    className={({ isActive }) =>
                        `p-2 rounded-md transition-colors ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`
                    }
                    title="Patients"
                >
                    <Users size={20} />
                </NavLink>

                <button
                    className="p-2 rounded-md hover:bg-white/10 transition-colors mt-auto"
                    title="Settings"
                >
                    <Settings size={20} />
                </button>
            </nav>

            <div className="mt-4">
                <button
                    onClick={() => logout()}
                    className="p-2 rounded-md hover:bg-white/10 transition-colors text-red-200 hover:text-red-100"
                    title="Logout"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </div>
    );
};

export default GlobalSidebar;
