import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../api';
import useAuthStore from '../store/authStore';
import { useAppStore } from '../core/store/appStore';
import { clearClientSession } from '../core/session/sessionActions';

const isMockMode = () => import.meta.env.VITE_DEV_MODE === 'true' || !import.meta.env.VITE_API_URL;

const RequireAuth = () => {
    const location = useLocation();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const login = useAuthStore((state) => state.login);
    const setMedicProfile = useAppStore((state) => state.setMedicProfile);
    const [authStatus, setAuthStatus] = useState(isAuthenticated ? 'authenticated' : 'checking');

    useEffect(() => {
        let isMounted = true;

        const verifySession = async () => {
            if (isAuthenticated && user) {
                setAuthStatus('authenticated');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                setAuthStatus('unauthenticated');
                return;
            }

            try {
                const currentUser = await authService.getCurrentUser();
                if (!isMounted) return;

                const normalizedUser = {
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email,
                };

                login(normalizedUser);
                setMedicProfile(currentUser);
                setAuthStatus('authenticated');
            } catch {
                if (!isMounted) return;
                clearClientSession();
                setAuthStatus('unauthenticated');
            }
        };

        verifySession();

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, login, setMedicProfile, user]);

    if (authStatus === 'checking') {
        return null;
    }

    if (authStatus !== 'authenticated') {
        return <Navigate to="/" replace state={{ from: location, reason: isMockMode() ? 'auth-required-demo' : 'auth-required' }} />;
    }

    return <Outlet />;
};

export default RequireAuth;
