import React from 'react';
import './UnlockOverlay.css';

const UnlockOverlay = ({ onClose }) => {
    return (
        <div className="unlock-overlay-wrapper">
            <div className="unlock-overlay-card">
                <div className="unlock-overlay-header">
                    <h3 className="unlock-overlay-title">Limited Access</h3>
                </div>
                <div className="unlock-overlay-body">
                    <p className="unlock-overlay-message">
                        Please contact our team to unlock this functionality, 
                        you can play around with the current example.
                    </p>
                    <div className="unlock-overlay-footer">
                        <button 
                            className="btn-unlock-confirm" 
                            onClick={onClose}
                        >
                            I got it
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnlockOverlay;
