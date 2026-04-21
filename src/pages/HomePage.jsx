import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { User, Lock } from 'lucide-react';

import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const login = useAuthStore((state) => state.login);
    const successMessage = location.state?.message;
    const isMock = import.meta.env.VITE_DEV_MODE === 'true' || !import.meta.env.VITE_API_URL;
    const [email, setEmail] = useState(isMock ? 'demo@example.com' : '');
    const [password, setPassword] = useState(isMock ? 'password' : '');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (isMock) {
            // Demo login - accept any credentials
            const userData = {
                id: 'medic-1',
                name: 'Dr. Daniel Smith',
                email: email,
                role: 'dentist'
            };
            
            login(userData);
            
            // Set medicProfile in appStore so PatientsListPage has it immediately
            const { useAppStore } = await import('../core/store/appStore');
            useAppStore.getState().setMedicProfile(userData);

            navigate('/patients');
            return;
        }

        try {
            const { authService } = await import('../api');
            const response = await authService.login({ email, password });
            
            // authService.login returns { id, name, email, token }
            localStorage.setItem('token', response.token);
            const userData = { id: response.id, name: response.name, email: response.email };
            login(userData);

            // Set medicProfile in appStore so PatientsListPage has it immediately
            const { useAppStore } = await import('../core/store/appStore');
            useAppStore.getState().setMedicProfile(userData);

            navigate('/patients');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="home-page-container">
            <div className="login-card">
                <div className="brand-header">
                    <img src="/logo.png" alt="Pixtooth Logo" className="brand-logo" />
                    <span className="brand-name">Pixtooth</span>
                </div>

                {successMessage && <div className="success-message" style={{ color: 'green', fontSize: '0.85rem', marginBottom: '15px', backgroundColor: '#e6fffa', padding: '10px', borderRadius: '4px', border: '1px solid #38b2ac' }}>{successMessage}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-wrapper">
                            <div className="input-icon-wrapper">
                                <User size={18} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-wrapper">
                            <div className="input-icon-wrapper">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ textAlign: 'left', marginTop: '-10px' }}>
                        <a href="#" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
                            Forgot password?
                        </a>
                    </div>

                    {error && <div className="error-message" style={{ color: 'red', fontSize: '0.85rem', marginBottom: '10px' }}>{error}</div>}

                    <button
                        type="submit"
                        className="submit-button"
                    >
                        Sign In
                    </button>
                </form>

                <div className="signup-link-container">
                    Don't have an account?
                    <span
                        className="signup-link"
                        onClick={() => navigate('/signup')}
                    >
                        Sign Up
                    </span>
                </div>

                {isMock && (
                    <div className="demo-text">
                        <p>Demo Mode: Click "Sign In" to continue</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
