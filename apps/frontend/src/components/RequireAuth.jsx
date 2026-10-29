import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../api';
import useAuthStore from '../store/authStore';
import { useAppStore } from '../core/store/appStore';
import { clearClientSession } from '../core/session/sessionActions';

const isMockMode = () => import.meta.env.VITE_DEV_MODE === 'true' || !import.meta.env.VITE_API_URL;

// Only the API is allowed to end a session. Anything else - an offline laptop, a
// restarted backend, a 502 from the proxy - must keep the stored tokens alive.
const isRejectedByServer = (error) => {
    const message = error?.message || '';
    return message === 'Invalid or expired token'
        || message === 'Unauthorized: No token provided'
        || message === 'Unauthorized';
};

const ConnectionProblem = ({ onRetry }) => (
    <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        textAlign: 'center',
        padding: '24px',
        color: 'var(--text-primary)',
    }}>
        <strong style={{ fontSize: '1.05rem' }}>Pixtooth can&apos;t reach the server</strong>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '340px' }}>
            Your session is still saved on this device. Check the connection and try again.
        </span>
        <button
            type="button"
            onClick={onRetry}
            style={{
                border: '1px solid var(--border-color-light)',
                background: 'var(--background-tertiary)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 18px',
                fontSize: '0.9rem',
                cursor: 'pointer',
            }}
        >
            Try again
        </button>
    </div>
);

const RequireAuth = () => {
    const location = useLocation();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const login = useAuthStore((state) => state.login);
    const setMedicProfile = useAppStore((state) => state.setMedicProfile);
    const [authStatus, setAuthStatus] = useState(isAuthenticated ? 'authenticated' : 'checking');
    const [retryCount, setRetryCount] = useState(0);

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
            } catch (error) {
                if (!isMounted) return;

                if (isRejectedByServer(error)) {
                    clearClientSession();
                    setAuthStatus('unauthenticated');
                    return;
                }

                setAuthStatus('unreachable');
            }
        };

        verifySession();

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, login, retryCount, setMedicProfile, user]);

    if (authStatus === 'checking') {
        return null;
    }

    if (authStatus === 'unreachable') {
        return (
            <ConnectionProblem
                onRetry={() => {
                    setAuthStatus('checking');
                    setRetryCount((count) => count + 1);
                }}
            />
        );
    }

    if (authStatus !== 'authenticated') {
        return <Navigate to="/" replace state={{ from: location, reason: isMockMode() ? 'auth-required-demo' : 'auth-required' }} />;
    }

    return <Outlet />;
};

export default RequireAuth;
