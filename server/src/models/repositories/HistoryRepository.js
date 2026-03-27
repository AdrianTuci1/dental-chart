const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const BaseRepository = require('./BaseRepository');

class HistoryRepository extends BaseRepository {

    // HISTORY PK format: PATIENT#<patient_id>
    // HISTORY SK format: HISTORY#<date_iso>#<history_id>

    async updateHistory(patientId, items) {
        const item = {
            PK: `PATIENT#${patientId}`,
            SK: `HISTORY#`,
            items: items,
            updatedAt: new Date().toISOString()
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item
        });

        await this.docClient.send(command);
        return items;
    }

    async getPatientHistory(patientId) {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                PK: `PATIENT#${patientId}`,
                SK: `HISTORY#`
            }
        });

        const response = await this.docClient.send(command);
        return response.Item ? response.Item.items : [];
    }
}

module.exports = HistoryRepository;
