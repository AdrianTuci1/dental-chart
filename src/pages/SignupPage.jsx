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

    const handleSignup = (e) => {
        e.preventDefault();
        // Here you would typically handle the signup logic
        console.log('Signup Data:', formData);

        // Navigate to home/login after successful signup (simulation)
        navigate('/');
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

                    <button type="submit" className="signup-button">
                        Sign Up
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
