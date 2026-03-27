import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, CheckCircle } from 'lucide-react';
import './SignupPage.css';

const SignupPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        try {
            const { authService } = await import('../api');
            const response = await authService.register({
                name: formData.name,
                email: formData.email,
                password: formData.password
            });
            
            // Store token for future requests
            if (response.token) {
                localStorage.setItem('token', response.token);
            }
            
            // Auto-login and redirect to dashboard
            const useAuthStore = (await import('../store/authStore')).default;
            const login = useAuthStore.getState().login;
            login(response.medic || response.user);
            
            navigate('/patients');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="signup-page-container">
            <div className="signup-card">
                <div className="brand-header">
                    <img src="/logo.png" alt="Pixtooth Logo" className="brand-logo" />
                    <span className="brand-name">Pixtooth</span>
                </div>

                <form onSubmit={handleSignup} className="signup-form">
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div className="input-wrapper">
                            <div className="input-icon-wrapper">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Dr. John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-wrapper">
                            <div className="input-icon-wrapper">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="name@clinic.com"
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
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Repeat Password</label>
                        <div className="input-wrapper">
                            <div className="input-icon-wrapper">
                                <CheckCircle size={18} />
                            </div>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && <div className="error-message" style={{ color: 'red', fontSize: '0.85rem', marginBottom: '10px' }}>{error}</div>}

                    <button type="submit" className="signup-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>

                <div className="login-link">
                    Already have an account?
                    <Link to="/" className="link-text">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
