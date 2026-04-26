const { PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const BaseRepository = require('./BaseRepository');

class TelemetryRepository extends BaseRepository {
    async createEvent(eventData) {
        const eventDate = eventData.timestamp.slice(0, 10);
        const item = {
            PK: `TELEMETRY#${eventDate}`,
            SK: `EVENT#${eventData.timestamp}#${eventData.id}`,
            ...eventData,
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item,
        });

        await this.send(command);
        return item;
    }

    async listEvents(filters = {}) {
        const expressionAttributeValues = {
            ':telemetryPrefix': 'TELEMETRY#',
            ':eventPrefix': 'EVENT#',
        };
        const filterParts = [
            'begins_with(PK, :telemetryPrefix)',
            'begins_with(SK, :eventPrefix)',
        ];

        if (filters.userId) {
            expressionAttributeValues[':userId'] = filters.userId;
            filterParts.push('userId = :userId');
        }

        if (filters.clinicId) {
            expressionAttributeValues[':clinicId'] = filters.clinicId;
            filterParts.push('clinicId = :clinicId');
        }

        if (filters.eventName) {
            expressionAttributeValues[':eventName'] = filters.eventName;
            filterParts.push('eventName = :eventName');
        }

        if (filters.source) {
            expressionAttributeValues[':source'] = filters.source;
            filterParts.push('source = :source');
        }

        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: filterParts.join(' AND '),
            ExpressionAttributeValues: expressionAttributeValues,
        });

        const response = await this.send(command);
        const items = (response.Items || []).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        const limit = Number(filters.limit) || 100;
        return items.slice(0, limit);
    }
}

module.exports = TelemetryRepository;
