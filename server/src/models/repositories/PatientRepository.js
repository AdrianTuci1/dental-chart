const {
    PutCommand,
    GetCommand,
    QueryCommand,
    ScanCommand,
    DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
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
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: 'medicId = :medicId AND SK = :sk AND begins_with(PK, :patientPrefix)',
            ExpressionAttributeValues: {
                ':medicId': medicId,
                ':sk': 'METADATA#',
                ':patientPrefix': 'PATIENT#',
            },
        });

        console.log(`[PatientRepository] Scanning for patients with medicId: ${medicId}`);
        const response = await this.send(command);
        console.log(`[PatientRepository] Found ${response.Items ? response.Items.length : 0} patients`);
        return response.Items || [];
    }

    async getPatientsByOwnerMedicId(ownerMedicId) {
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: 'ownerMedicId = :ownerMedicId AND SK = :sk AND begins_with(PK, :patientPrefix)',
            ExpressionAttributeValues: {
                ':ownerMedicId': ownerMedicId,
                ':sk': 'METADATA#',
                ':patientPrefix': 'PATIENT#',
            },
        });

        const response = await this.send(command);
        return response.Items || [];
    }

    async countPatientsByOwnerMedicId(ownerMedicId) {
        const patients = await this.getPatientsByOwnerMedicId(ownerMedicId);
        return patients.length;
    }

    async getPatientsByClinicIds(clinicIds = []) {
        if (!clinicIds.length) {
            return [];
        }

        const expressionAttributeValues = {
            ':sk': 'METADATA#',
            ':patientPrefix': 'PATIENT#',
        };

        const clinicPlaceholders = clinicIds.map((clinicId, index) => {
            const key = `:clinicId${index}`;
            expressionAttributeValues[key] = clinicId;
            return key;
        });

        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: `SK = :sk AND begins_with(PK, :patientPrefix) AND clinicId IN (${clinicPlaceholders.join(', ')})`,
            ExpressionAttributeValues: expressionAttributeValues,
        });

        const response = await this.send(command);
        return response.Items || [];
    }

    async deletePatient(id) {
        // First get all items for this patient (METADATA, HISTORY, PLAN)
        const items = await this.getPatientWithChartAndHistory(id);
        
        if (items.length === 0) return;

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

    async deletePatientsByOwnerMedicId(ownerMedicId) {
        const patients = await this.getPatientsByOwnerMedicId(ownerMedicId);

        for (const patient of patients) {
            await this.deletePatient(patient.id);
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
