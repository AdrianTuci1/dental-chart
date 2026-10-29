export const GA4EventAdapter = {
    toEventPayload(eventName, params = {}, sessionId) {
        return {
            eventName,
            ...params,
            sessionId: params.sessionId || sessionId,
        };
    },

    toUserConfig(user) {
        if (!user?.id) {
            return null;
        }

        return {
            user_id: user.id,
        };
    },

    toUserProperties(user) {
        if (!user?.subscriptionPlan) {
            return null;
        }

        return {
            plan: user.subscriptionPlan,
        };
    },
};
