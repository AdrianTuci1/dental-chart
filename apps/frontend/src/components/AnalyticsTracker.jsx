import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../core/store/appStore';
import { AppFacade } from '../core/AppFacade';

const AnalyticsTracker = () => {
    const location = useLocation();
    const medicProfile = useAppStore((state) => state.medicProfile);

    useEffect(() => {
        AppFacade.analytics.setUser(medicProfile);
    }, [medicProfile]);

    useEffect(() => {
        AppFacade.analytics.pageViewed(location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        AppFacade.analytics.sessionStarted(location.pathname);

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                AppFacade.analytics.sessionHeartbeat(window.location.pathname);
            }
        }, 60000);

        const handleVisibilityChange = () => {
            AppFacade.analytics.visibilityChanged(document.visibilityState, window.location.pathname);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return null;
};

export default AnalyticsTracker;
