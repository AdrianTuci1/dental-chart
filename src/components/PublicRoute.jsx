import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const PublicRoute = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const [authStatus, setAuthStatus] = useState(isAuthenticated ? 'authenticated' : 'checking');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!isAuthenticated && !token) {
            setAuthStatus('unauthenticated');
        } else if (isAuthenticated || token) {
            setAuthStatus('authenticated');
        }
    }, [isAuthenticated]);

    if (authStatus === 'checking') {
        return null;
    }

    if (authStatus === 'authenticated') {
        return <Navigate to="/patients" replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
