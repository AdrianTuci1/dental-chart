const { v4: uuidv4 } = require('uuid');
const TelemetryRepository = require('../models/repositories/TelemetryRepository');

class TelemetryService {
    constructor() {
        this.telemetryRepository = new TelemetryRepository();
    }

    async trackEvent(eventData) {
        const timestamp = eventData.timestamp || new Date().toISOString();
        const normalizedEvent = {
            id: eventData.id || uuidv4(),
            timestamp,
            source: eventData.source || 'server',
            category: eventData.category || 'system',
            eventName: eventData.eventName,
            userId: eventData.userId || null,
            clinicId: eventData.clinicId || null,
            entityType: eventData.entityType || null,
            entityId: eventData.entityId || null,
            sessionId: eventData.sessionId || null,
            metadata: eventData.metadata || {},
        };

        return this.telemetryRepository.createEvent(normalizedEvent);
    }

    async listEvents(filters) {
        return this.telemetryRepository.listEvents(filters);
    }

    async listProductEvents(filters = {}) {
        const events = await this.telemetryRepository.listEvents({
            eventName: filters.eventName,
            source: filters.source,
            limit: filters.limit,
        });

        const since = filters.since ? new Date(filters.since).getTime() : null;
        const until = filters.until ? new Date(filters.until).getTime() : null;

        return events
            .filter((event) => {
                const timestamp = new Date(event.timestamp).getTime();

                if (since && timestamp < since) {
                    return false;
                }

                if (until && timestamp > until) {
                    return false;
                }

                return true;
            })
            .map((event) => ({
                id: event.id,
                timestamp: event.timestamp,
                source: event.source,
                category: event.category,
                eventName: event.eventName,
                userId: event.userId,
                entityType: event.entityType,
                entityId: event.entityId,
                sessionId: event.sessionId,
                metadata: event.metadata || {},
            }));
    }
}

module.exports = TelemetryService;
