/**
 * Adapts individual UI events to the "User Analytics Profile" format.
 */
export const AnalyticsAdapter = {
    // Configuration for route mapping
    ROUTE_MAP: [
        { pattern: '/patients', exact: true, name: 'Patients List' },
        { pattern: '/dashboard', includes: true, name: 'Patient Dashboard' },
        { pattern: '/chart', includes: true, name: 'Patient Chart' },
        { pattern: '/report', includes: true, name: 'Patient Report' },
        { pattern: '/teeth/', includes: true, name: 'Tooth Details' },
        { pattern: '/scan/', includes: true, name: 'AI Scan View' },
        { pattern: '/settings', includes: true, name: 'Settings' }
    ],

    toProfileUpdate(eventName, params = {}) {
        const payload = {};

        // 1. Map page views or menu clicks to menuName
        if (eventName === 'page_viewed' || eventName === 'menu_clicked' || eventName === 'page_view' || eventName === 'app_session_heartbeat') {
            // Priority: params.menuName > params.metadata.menuName > params.pathname > window.location
            const rawMenu = params.menuName || 
                           params.metadata?.menuName || 
                           params.pathname || 
                           params.page_path || 
                           params.page_title || 
                           (typeof window !== 'undefined' ? window.location.pathname : null);
            
            if (rawMenu) {
                // Find matching route name from configuration
                const match = this.ROUTE_MAP.find(route => {
                    if (route.exact) return rawMenu === route.pattern || rawMenu === route.pattern.substring(1);
                    if (route.includes) return rawMenu.includes(route.pattern);
                    return false;
                });

                payload.menuName = match ? match.name : (rawMenu === '/' ? 'General Dashboard' : rawMenu);
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
