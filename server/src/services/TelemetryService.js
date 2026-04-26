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
}

module.exports = TelemetryService;
