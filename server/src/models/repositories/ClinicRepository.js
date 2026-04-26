const {
    PutCommand,
    GetCommand,
    QueryCommand,
    ScanCommand,
    DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
const BaseRepository = require('./BaseRepository');

class ClinicRepository extends BaseRepository {
    async createClinic(clinicData) {
        const item = {
            PK: `CLINIC#${clinicData.id}`,
            SK: `METADATA#`,
            ...clinicData,
            createdAt: new Date().toISOString()
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item
        });

        await this.send(command);
        return item;
    }

    async updateClinic(id, clinicData) {
        const item = {
            PK: `CLINIC#${id}`,
            SK: 'METADATA#',
            ...clinicData,
            id,
            updatedAt: new Date().toISOString(),
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item,
        });

        await this.send(command);
        return item;
    }

    async getClinicById(id) {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                PK: `CLINIC#${id}`,
                SK: `METADATA#`
            }
        });

        const response = await this.send(command);
        return response.Item;
    }

    async upsertClinicMember(clinicId, membershipData) {
        const item = {
            PK: `CLINIC#${clinicId}`,
            SK: `MEMBER#${membershipData.medicId}`,
            clinicId,
            ...membershipData,
            updatedAt: new Date().toISOString(),
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item,
        });

        await this.send(command);
        return item;
    }

    async getClinicMember(clinicId, medicId) {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                PK: `CLINIC#${clinicId}`,
                SK: `MEMBER#${medicId}`,
            },
        });

        const response = await this.send(command);
        return response.Item;
    }

    async listClinicMembers(clinicId) {
        const command = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :memberPrefix)',
            ExpressionAttributeValues: {
                ':pk': `CLINIC#${clinicId}`,
                ':memberPrefix': 'MEMBER#',
            },
        });

        const response = await this.send(command);
        return response.Items || [];
    }

    async deleteClinicMember(clinicId, medicId) {
        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: {
                PK: `CLINIC#${clinicId}`,
                SK: `MEMBER#${medicId}`,
            },
        });

        await this.send(command);
    }

    async listClinicsByMedicId(medicId) {
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: 'medicId = :medicId AND begins_with(SK, :memberPrefix)',
            ExpressionAttributeValues: {
                ':medicId': medicId,
                ':memberPrefix': 'MEMBER#',
            },
        });

        const response = await this.send(command);
        return response.Items || [];
    }

    async listOwnedClinicsByMedicId(medicId) {
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: 'ownerMedicId = :medicId AND SK = :metadataSk AND begins_with(PK, :clinicPrefix)',
            ExpressionAttributeValues: {
                ':medicId': medicId,
                ':metadataSk': 'METADATA#',
                ':clinicPrefix': 'CLINIC#',
            },
        });

        const response = await this.send(command);
        return response.Items || [];
    }

    async createInvitation(clinicId, invitationData) {
        const item = {
            PK: `CLINIC#${clinicId}`,
            SK: `INVITE#${invitationData.id}`,
            clinicId,
            ...invitationData,
            createdAt: new Date().toISOString(),
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item,
        });

        await this.send(command);
        return item;
    }

    async getInvitation(clinicId, inviteId) {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                PK: `CLINIC#${clinicId}`,
                SK: `INVITE#${inviteId}`,
            },
        });

        const response = await this.send(command);
        return response.Item;
    }

    async updateInvitation(clinicId, inviteId, invitationData) {
        const item = {
            PK: `CLINIC#${clinicId}`,
            SK: `INVITE#${inviteId}`,
            clinicId,
            ...invitationData,
            id: inviteId,
            updatedAt: new Date().toISOString(),
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item,
        });

        await this.send(command);
        return item;
    }

    async listClinicInvitations(clinicId) {
        const command = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :invitePrefix)',
            ExpressionAttributeValues: {
                ':pk': `CLINIC#${clinicId}`,
                ':invitePrefix': 'INVITE#',
            },
        });

        const response = await this.send(command);
        return response.Items || [];
    }

    async listPendingInvitationsByEmail(email) {
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: 'invitedEmail = :email AND #status = :status AND begins_with(SK, :invitePrefix)',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':email': email,
                ':status': 'pending',
                ':invitePrefix': 'INVITE#',
            },
        });

        const response = await this.send(command);
        return response.Items || [];
    }

    async listClinicRecords(clinicId) {
        const command = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `CLINIC#${clinicId}`,
            },
        });

        const response = await this.send(command);
        return response.Items || [];
    }

    async deleteClinic(clinicId) {
        const records = await this.listClinicRecords(clinicId);

        for (const record of records) {
            const command = new DeleteCommand({
                TableName: this.tableName,
                Key: {
                    PK: record.PK,
                    SK: record.SK,
                },
            });

            await this.send(command);
        }
    }
}

module.exports = ClinicRepository;
