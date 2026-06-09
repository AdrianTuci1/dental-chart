const UserAnalyticsRepository = require('../models/repositories/UserAnalyticsRepository');

class UserAnalyticsService {
    constructor() {
        this.repository = new UserAnalyticsRepository();
    }

    async trackLogin(userId) {
        if (process.env.ENABLE_TELEMETRY === 'false') return;
        return this.repository.updateUserProfile(userId, { incrementLogin: true });
    }

    async trackFeatureUsage(userId, featureName) {
        if (process.env.ENABLE_TELEMETRY === 'false') return;
        const flagKey = `hasUsed_${featureName}`;
        return this.repository.updateUserProfile(userId, {
            flags: { [flagKey]: true }
        });
    }

    async trackOnboarding(userId, step) {
        if (process.env.ENABLE_TELEMETRY === 'false') return;
        return this.repository.updateUserProfile(userId, {
            flags: { [`onboarding_${step}`]: true }
        });
    }

    async trackNavigation(userId, menuName) {
        if (process.env.ENABLE_TELEMETRY === 'false') return;
        // In a real app, we might check if menu already exists in the list to avoid duplicates
        // but for simplicity and single log per user, this update is atomic.
        return this.repository.updateUserProfile(userId, { menuVisited: menuName });
    }

    async trackHeartbeat(userId, minutes = 1) {
        if (process.env.ENABLE_TELEMETRY === 'false') return;
        return this.repository.updateUserProfile(userId, { incrementTime: minutes });
    }

    async trackMetadata(userId, metadata) {
        if (process.env.ENABLE_TELEMETRY === 'false') return;
        return this.repository.updateUserProfile(userId, { metadata });
    }

    async getUserAnalytics(userId) {
        const data = await this.repository.getUserProfile(userId);
        if (!data) return null;

        // Clean up the unique menus list
        if (data.visitedMenus) {
            data.visitedMenus = [...new Set(data.visitedMenus)];
        }

        return data;
    }
}

module.exports = UserAnalyticsService;
