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

// Google's four-colour mark, used by the demo stand-in so the button is recognisable.
const GoogleGlyph = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3c-1.08.72-2.46 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A11.99 11.99 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.26a12 12 0 0 0 0 10.76l4.01-3.1z" />
        <path fill="#EA4335" d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 11.99 11.99 0 0 0 1.26 6.62l4.01 3.1C6.22 6.87 8.87 4.76 12 4.76z" />
    </svg>
);

/**
 * "Continue with Google" rendered by Google's own button. Without VITE_GOOGLE_CLIENT_ID
 * the component renders nothing, except in demo mode, where it shows a simulated button
 * so the login screen can be reviewed without a Google project.
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

    // Demo mode has no Google project, but the login screen still shows the option.
    if (unavailable || (!clientId && !isMockMode)) {
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
                    <GoogleGlyph />
                    Continue with Google
                </button>
            ) : (
                <div className="social-auth-google-holder" ref={holderRef} />
            )}
        </div>
    );
};

export default GoogleSignInButton;
