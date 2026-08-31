import React, { useEffect, useRef, useState } from 'react';
import './GoogleSignInButton.css';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

// Google Identity Services is loaded once per page; the promise is shared so the
// script tag is never injected twice.
let gisPromise = null;

const loadGoogleIdentity = () => {
    if (window.google?.accounts?.id) {
        return Promise.resolve(window.google);
    }

    if (!gisPromise) {
        gisPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = GIS_SRC;
            script.async = true;
            script.onload = () => (window.google?.accounts?.id
                ? resolve(window.google)
                : reject(new Error('Google Identity Services did not initialise')));
            script.onerror = () => {
                gisPromise = null;
                reject(new Error('Google Identity Services could not be loaded'));
            };
            document.head.appendChild(script);
        });
    }

    return gisPromise;
};

/**
 * "Continue with Google" rendered by Google's own button. Without VITE_GOOGLE_CLIENT_ID
 * the component renders nothing, so the password form stays the only option.
 */
const GoogleSignInButton = ({ clientId, isMockMode = false, onCredential }) => {
    const holderRef = useRef(null);
    const [unavailable, setUnavailable] = useState(false);

    useEffect(() => {
        if (!clientId || isMockMode || unavailable) {
            return undefined;
        }

        let cancelled = false;

        loadGoogleIdentity()
            .then((google) => {
                if (cancelled || !holderRef.current) {
                    return;
                }

                google.accounts.id.initialize({
                    client_id: clientId,
                    callback: (response) => {
                        if (response?.credential) {
                            onCredential(response.credential);
                        }
                    },
                });

                google.accounts.id.renderButton(holderRef.current, {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'pill',
                    width: 280,
                });
            })
            .catch(() => {
                // A blocked or offline Google script must not break the sign-in page.
                if (!cancelled) {
                    setUnavailable(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [clientId, isMockMode, unavailable, onCredential]);

    if (!clientId || unavailable) {
        return null;
    }

    return (
        <div className="social-auth">
            <div className="social-auth-divider"><span>or</span></div>
            {isMockMode ? (
                <button
                    type="button"
                    className="social-auth-dev-button"
                    onClick={() => onCredential('dev-google-credential')}
                >
                    Continue with Google
                    <span className="social-auth-dev-tag">dev</span>
                </button>
            ) : (
                <div className="social-auth-google-holder" ref={holderRef} />
            )}
        </div>
    );
};

export default GoogleSignInButton;
