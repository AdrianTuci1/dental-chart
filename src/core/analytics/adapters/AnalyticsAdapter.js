/**
 * Adapts individual UI events to the "User Analytics Profile" format.
 * Instead of raw events, we map them to menu names or onboarding steps.
 */
export const AnalyticsAdapter = {
    toProfileUpdate(eventName, params = {}) {
        const payload = {};

        // 1. Map page views or menu clicks to menuName
        if (eventName === 'page_viewed' || eventName === 'menu_clicked' || eventName === 'page_view') {
            const rawMenu = params.menuName || params.metadata?.menuName || params.pathname || params.page_path || params.page_title;
            
            if (rawMenu) {
                let cleanMenu = rawMenu;

                // Systematic Route Mapping
                if (cleanMenu === '/patients' || cleanMenu === 'patients') {
                    cleanMenu = 'Patients List';
                } else if (cleanMenu.includes('/dashboard')) {
                    cleanMenu = 'Patient Dashboard';
                } else if (cleanMenu.includes('/chart')) {
                    cleanMenu = 'Patient Chart';
                } else if (cleanMenu.includes('/report')) {
                    cleanMenu = 'Patient Report';
                } else if (cleanMenu.includes('/teeth/')) {
                    cleanMenu = 'Tooth Details';
                } else if (cleanMenu.startsWith('/scan/')) {
                    cleanMenu = 'AI Scan View';
                } else if (cleanMenu === '/' || cleanMenu === '/dashboard') {
                    cleanMenu = 'General Dashboard';
                }

                payload.menuName = cleanMenu;
            } else {
                payload.menuName = 'Unknown Section';
            }
        }

        // 2. Map onboarding events
        if (eventName === 'onboarding_completed') {
            payload.onboardingStep = 'completed';
        }
        
        if (eventName === 'login_completed') {
            payload.onboardingStep = 'logged_in';
        }

        // 3. Map heartbeats (for time spent tracking)
        if (eventName === 'app_session_heartbeat') {
            payload.heartbeat = { minutes: params.minutes || 1 };
        }

        return Object.keys(payload).length > 0 ? payload : null;
    },
};
