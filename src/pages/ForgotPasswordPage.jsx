import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import './SignupPage.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('');
        setIsSubmitting(true);

        try {
            const { authService } = await import('../api');
            const response = await authService.forgotPassword({ email });
            setStatus(response.message || 'If an account exists for this email, a reset email has been sent.');
        } catch (err) {
            setError(err.message || 'Unable to send reset email.');
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
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                placeholder="name@clinic.com"
                                required
                            />
                        </div>
                    </div>

                    {status && <div className="success-message" style={{ color: 'green', fontSize: '0.85rem', marginBottom: '10px' }}>{status}</div>}
                    {error && <div className="error-message" style={{ color: 'red', fontSize: '0.85rem', marginBottom: '10px' }}>{error}</div>}

                    <button type="submit" className="signup-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : 'Send Reset Email'}
                    </button>
                </form>

                <div className="login-link">
                    Remembered it?
                    <Link to="/" className="link-text">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
