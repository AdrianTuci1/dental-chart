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

        await this.docClient.send(command);
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

        const response = await this.docClient.send(command);
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

        const response = await this.docClient.send(command);
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
        const response = await this.docClient.send(command);
        console.log(`[PatientRepository] Found ${response.Items ? response.Items.length : 0} patients`);
        return response.Items || [];
    }
}

module.exports = PatientRepository;
