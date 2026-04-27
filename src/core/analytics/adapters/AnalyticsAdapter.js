/**
 * Adapts individual UI events to the "User Analytics Profile" format.
 */
export const AnalyticsAdapter = {
    // Configuration for route mapping - ordered from most specific to least specific
    ROUTE_MAP: [
        { pattern: '/settings', name: 'Settings' },
        { pattern: '/tooth', name: 'Tooth' },
        { pattern: '/scan', name: 'Scan' },
        { pattern: '/chart', name: 'Chart' },
        { pattern: '/report', name: 'Report' },
        { pattern: '/dashboard', name: 'Dashboard' },
        { pattern: '/patients/', name: 'Dashboard' }, // matches /patients/id
        { pattern: '/patients', name: 'Patients' }
    ],

    getCookieGtagClientId() {
        if (typeof document === 'undefined') {
            return null;
        }

        const gaCookie = document.cookie
            .split('; ')
            .find((cookie) => cookie.startsWith('_ga='));

        if (!gaCookie) {
            return null;
        }

        const rawValue = decodeURIComponent(gaCookie.split('=').slice(1).join('='));
        const segments = rawValue.split('.');

        if (segments.length < 4) {
            return rawValue || null;
        }

        return `${segments[segments.length - 2]}.${segments[segments.length - 1]}`;
    },

    async getGtagClientId({ timeoutMs = 800 } = {}) {
        const cookieClientId = this.getCookieGtagClientId();
        const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

        if (!measurementId || typeof window === 'undefined' || typeof window.gtag !== 'function') {
            return cookieClientId;
        }

        return new Promise((resolve) => {
            let settled = false;
            const finish = (value) => {
                if (settled) {
                    return;
                }

                settled = true;
                window.clearTimeout(timeoutId);
                resolve(value || cookieClientId || null);
            };

            const timeoutId = window.setTimeout(() => finish(cookieClientId), timeoutMs);

            try {
                window.gtag('get', measurementId, 'client_id', finish);
            } catch {
                finish(cookieClientId);
            }
        });
    },

    async getRegistrationMetadata() {
        const gtagClientId = await this.getGtagClientId();

        if (!gtagClientId) {
            return null;
        }

        return { gtagClientId };
    },

    toProfileUpdate(eventName, params = {}) {
        const payload = {};

        // 1. Map page views or menu clicks to menuName
        if (eventName === 'page_viewed' || eventName === 'menu_clicked' || eventName === 'page_view' || eventName === 'app_session_heartbeat') {
            // Priority: params.menuName > params.metadata.menuName > params.pathname > params.metadata.pathname > window.location
            const rawMenu = params.menuName || 
                           params.metadata?.menuName || 
                           params.pathname || 
                           params.metadata?.pathname ||
                           params.page_path || 
                           (typeof window !== 'undefined' ? window.location.pathname : null);
            
            if (rawMenu) {
                // Normalize input to a path format (e.g. "chart" -> "/chart") for consistent matching
                const normalizedPath = String(rawMenu).startsWith('/') ? rawMenu : `/${rawMenu}`;
                
                // Try ROUTE_MAP
                const match = this.ROUTE_MAP.find(route => {
                    // Special case for exact patients list
                    if (route.pattern === '/patients') return normalizedPath === '/patients' || normalizedPath === '/patients/';
                    return String(normalizedPath).includes(route.pattern);
                });

                if (match) {
                    payload.menuName = match.name;
                }
                // Note: If no match is found, we don't set menuName, effectively skipping telemetry for unknown/auth pages
            }
        }

        // 2. Map onboarding events
        if (eventName === 'onboarding_completed') payload.onboardingStep = 'completed';
        if (eventName === 'login_completed') payload.onboardingStep = 'logged_in';

        // 3. Map heartbeats
        if (eventName === 'app_session_heartbeat') {
            payload.heartbeat = { minutes: params.minutes || 1 };
        }

        // Ensure we don't return an empty object if no mapping was found
        return Object.keys(payload).length > 0 ? payload : null;
    },
};
