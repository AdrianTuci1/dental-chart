const { PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const BaseRepository = require('./BaseRepository');

class TreatmentPlanRepository extends BaseRepository {

    // PLAN PK format: PATIENT#<patient_id>
    // PLAN SK format: PLAN#<date_iso>#<plan_id>

    async addTreatmentPlanItem(patientId, planData) {
        const dateStr = new Date().toISOString();
        const item = {
            PK: `PATIENT#${patientId}`,
            SK: `PLAN#${dateStr}#${planData.id}`,
            ...planData,
            createdAt: dateStr
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item
        });

        await this.docClient.send(command);
        return item;
    }

    async getPatientTreatmentPlans(patientId) {
        const command = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
            ExpressionAttributeValues: {
                ':pk': `PATIENT#${patientId}`,
                ':skPrefix': 'PLAN#'
            }
        });

        const response = await this.docClient.send(command);
        return response.Items || [];
    }
}

module.exports = TreatmentPlanRepository;
