import { analyticsService } from '../../api';
import { GA4EventAdapter } from './adapters/GA4EventAdapter';
import { AnalyticsAdapter } from './adapters/AnalyticsAdapter';

class AnalyticsProxy {
    constructor() {
        this.measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
        this.initialized = false;
        this.sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `session-${Date.now()}`;
    }

    init() {
        if (this.initialized || typeof window === 'undefined') {
            return;
        }

        if (this.measurementId) {
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function gtag() {
                window.dataLayer.push(arguments);
            };

            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
            document.head.appendChild(script);

            window.gtag('js', new Date());
            window.gtag('config', this.measurementId, { send_page_view: false });
        }

        this.initialized = true;
    }

    setUser(user) {
        this.init();

        if (!this.measurementId || !window.gtag) {
            return;
        }

        const userConfig = GA4EventAdapter.toUserConfig(user);
        const userProperties = GA4EventAdapter.toUserProperties(user);

        if (userConfig) {
            window.gtag('config', this.measurementId, userConfig);
        }

        if (userProperties) {
            window.gtag('set', 'user_properties', userProperties);
        }
    }

    async track(eventName, params = {}) {
        this.init();

        if (this.measurementId && window.gtag) {
            const gaPayload = GA4EventAdapter.toEventPayload(eventName, params, this.sessionId);
            window.gtag('event', eventName, gaPayload);
        }

        try {
            const profilePayload = AnalyticsAdapter.toProfileUpdate(eventName, params);
            if (profilePayload) {
                await analyticsService.updateProfile(profilePayload);
            }
        } catch (error) {
            console.error('[AnalyticsProxy] Failed to update user profile', error);
        }
    }
}

export const analyticsProxy = new AnalyticsProxy();
