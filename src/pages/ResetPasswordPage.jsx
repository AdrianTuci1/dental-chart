import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Lock, Mail, Shield } from 'lucide-react';
import './SignupPage.css';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const initialEmail = searchParams.get('email') || '';
    const token = searchParams.get('token') || '';
    const [formData, setFormData] = useState({
        email: initialEmail,
        code: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const hasToken = useMemo(() => Boolean(token), [token]);

    const handleChange = (e) => {
        setFormData((current) => ({
            ...current,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        try {
            const { authService } = await import('../api');
            await authService.resetPassword({
                email: formData.email,
                token: token || undefined,
                code: formData.code || undefined,
                newPassword: formData.newPassword,
            });
            setStatus('Password updated. You can sign in now.');
        } catch (err) {
            setError(err.message || 'Unable to reset password.');
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

                <form onSubmit={handleSubmit} className="signup-form">
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

                    {!hasToken && (
                        <div className="form-group">
                            <label className="form-label">6-digit Code</label>
                            <div className="input-wrapper">
                                <div className="input-icon-wrapper">
                                    <Shield size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="123456"
                                    maxLength={6}
                                    required={!hasToken}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <div className="input-wrapper">
                            <div className="input-icon-wrapper">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Repeat New Password</label>
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

                    {status && <div className="success-message" style={{ color: 'green', fontSize: '0.85rem', marginBottom: '10px' }}>{status}</div>}
                    {error && <div className="error-message" style={{ color: 'red', fontSize: '0.85rem', marginBottom: '10px' }}>{error}</div>}

                    <button type="submit" className="signup-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Updating...' : 'Set New Password'}
                    </button>
                </form>

                <div className="login-link">
                    Back to
                    <Link to="/" className="link-text">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
