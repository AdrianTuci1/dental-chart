const { PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const BaseRepository = require('./BaseRepository');

class PatientRepository extends BaseRepository {

    // PATIENT PK format: PATIENT#<patient_id>
    // PATIENT SK format: METADATA#

    async createPatient(patientData) {
        const item = {
            PK: `PATIENT#${patientData.id}`,
            SK: `METADATA#`,
            ...patientData,
            createdAt: new Date().toISOString()
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item
        });

        await this.send(command);
        return item;
    }

    async getPatientById(id) {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                PK: `PATIENT#${id}`,
                SK: `METADATA#`
            }
        });

        const response = await this.send(command);
        return response.Item;
    }

    async getPatientWithChartAndHistory(id) {
        // Query to get everything for a patient (PATIENT info, PLANS, HISTORY)
        const command = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `PATIENT#${id}`
            }
        });

        const response = await this.send(command);
        return response.Items || [];
    }

    async getPatientsByMedicId(medicId) {
        // For a true Single-Table Design, we'd use a GSI.
        // For this demo/mock execution, we'll Scan with a filter on medicId.
        const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: 'medicId = :medicId AND SK = :sk',
            ExpressionAttributeValues: {
                ':medicId': medicId,
                ':sk': 'METADATA#'
            }
        });

        console.log(`[PatientRepository] Scanning for patients with medicId: ${medicId}`);
        const response = await this.send(command);
        console.log(`[PatientRepository] Found ${response.Items ? response.Items.length : 0} patients`);
        return response.Items || [];
    }

    async deletePatient(id) {
        // First get all items for this patient (METADATA, HISTORY, PLAN)
        const items = await this.getPatientWithChartAndHistory(id);
        
        if (items.length === 0) return;

        const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
        
        // Delete each item found
        for (const item of items) {
            const command = new DeleteCommand({
                TableName: this.tableName,
                Key: {
                    PK: item.PK,
                    SK: item.SK
                }
            });
            await this.send(command);
        }
    }

    async updatePatient(id, patientData) {
        const item = {
            PK: `PATIENT#${id}`,
            SK: `METADATA#`,
            ...patientData,
            updatedAt: new Date().toISOString()
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item
        });

        await this.send(command);
        return item;
    }
}

module.exports = PatientRepository;
