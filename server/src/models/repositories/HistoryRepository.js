const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const BaseRepository = require('./BaseRepository');

class HistoryRepository extends BaseRepository {

    // HISTORY PK format: PATIENT#<patient_id>
    // HISTORY SK format: HISTORY#<date_iso>#<history_id>

    async addHistoryRecord(patientId, historyData) {
        const dateStr = new Date().toISOString();
        const item = {
            PK: `PATIENT#${patientId}`,
            SK: `HISTORY#${dateStr}#${historyData.id}`,
            ...historyData,
            createdAt: dateStr
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item
        });

        await this.docClient.send(command);
        return item;
    }

    async getPatientHistory(patientId) {
        // Query just the HISTORY items
        const command = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
            ExpressionAttributeValues: {
                ':pk': `PATIENT#${patientId}`,
                ':skPrefix': 'HISTORY#'
            }
        });

        const response = await this.docClient.send(command);
        return response.Items || [];
    }
}

module.exports = HistoryRepository;
