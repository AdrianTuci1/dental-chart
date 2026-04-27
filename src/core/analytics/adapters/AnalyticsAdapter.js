/**
 * Adapts individual UI events to the "User Analytics Profile" format.
 * Instead of raw events, we map them to menu names or onboarding steps.
 */
export const AnalyticsAdapter = {
    toProfileUpdate(eventName, params = {}) {
        const payload = {};

        // 1. Map page views or menu clicks to menuName
        if (eventName === 'page_viewed' || eventName === 'menu_clicked') {
            payload.menuName = params.menuName || params.pathname || 'Unknown';
        }

        // 2. Map onboarding events
        if (eventName === 'onboarding_completed') {
            payload.onboardingStep = 'completed';
        }
        
        if (eventName === 'login_completed') {
            payload.onboardingStep = 'logged_in';
        }

        // 3. Fallback for other events - if it's a feature, we could track it as used
        // but for now we focus on the user's explicit request for navigation and onboarding.

        return Object.keys(payload).length > 0 ? payload : null;
    },
};
