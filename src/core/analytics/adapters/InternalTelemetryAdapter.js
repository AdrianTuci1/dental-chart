export const InternalTelemetryAdapter = {
    toEventPayload(eventName, params = {}, sessionId) {
        return {
            eventName,
            category: params.category || 'product',
            clinicId: params.clinicId || null,
            entityType: params.entityType || null,
            entityId: params.entityId || null,
            sessionId: params.sessionId || sessionId,
            metadata: params.metadata || {},
            source: 'client',
        };
    },
};
