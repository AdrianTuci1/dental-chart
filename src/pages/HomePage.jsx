import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { User, Lock } from 'lucide-react';

import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [email, setEmail] = useState('demo@example.com');
    const [password, setPassword] = useState('password');

    const handleLogin = (e) => {
        e.preventDefault();
        // Demo login - accept any credentials
        login({
            id: '1',
            name: 'Dr. Demo',
            email: email,
            role: 'dentist'
        });
        navigate('/patients');
    };

    return (
        <div className="home-page-container">
            <div className="login-card">
                <div className="brand-header">
                    <img src="/logo.png" alt="Pixtooth Logo" className="brand-logo" />
                    <span className="brand-name">Pixtooth</span>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-wrapper">
                            <div className="input-icon-wrapper">
                                <User className="input-icon" />
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
                                <Lock className="input-icon" />
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

                <div className="demo-text">
                    <p>Demo Mode: Click "Sign In" to continue</p>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
