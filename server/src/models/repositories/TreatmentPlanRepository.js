const { PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const BaseRepository = require('./BaseRepository');

class TreatmentPlanRepository extends BaseRepository {

    // PLAN PK format: PATIENT#<patient_id>
    // PLAN SK format: PLAN#<date_iso>#<plan_id>

    async updateTreatmentPlan(patientId, items) {
        const item = {
            PK: `PATIENT#${patientId}`,
            SK: `PLAN#`,
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

    async getPatientTreatmentPlans(patientId) {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                PK: `PATIENT#${patientId}`,
                SK: `PLAN#`
            }
        });

        const response = await this.docClient.send(command);
        return response.Item ? response.Item.items : [];
    }
}

module.exports = TreatmentPlanRepository;
