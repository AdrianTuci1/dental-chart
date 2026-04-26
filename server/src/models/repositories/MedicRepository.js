const { PutCommand, GetCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const BaseRepository = require('./BaseRepository');

class MedicRepository extends BaseRepository {

    // MEDIC PK format: MEDIC#<medic_id>
    // MEDIC SK format: METADATA#

    async createMedic(medicData) {
        const item = {
            PK: `MEDIC#${medicData.id}`,
            SK: `METADATA#`,
            ...medicData,
            createdAt: new Date().toISOString()
        };

        const command = new PutCommand({
            TableName: this.tableName,
            Item: item
        });

        await this.send(command);
        return item;
    }

    async getMedicById(id) {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                PK: `MEDIC#${id}`,
                SK: `METADATA#`
            }
        });

        const response = await this.send(command);
        return response.Item;
    }

    async updateMedic(id, medicData) {
        const item = {
            PK: `MEDIC#${id}`,
            SK: 'METADATA#',
            ...medicData,
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

    async savePasswordResetState(id, resetData) {
        const existingMedic = await this.getMedicById(id);
        if (!existingMedic) {
            return null;
        }

        return this.updateMedic(id, {
            ...existingMedic,
            ...resetData,
        });
    }

    async getMedicByEmail(email) {
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: 'email = :email AND SK = :sk AND begins_with(PK, :medicPrefix)',
            ExpressionAttributeValues: {
                ':email': email,
                ':sk': 'METADATA#',
                ':medicPrefix': 'MEDIC#',
            },
        });

        const response = await this.send(command);
        return response.Items && response.Items.length > 0 ? response.Items[0] : null;
    }

    async getMedicByApiKey(apiKey) {
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: 'apiKey = :apiKey AND SK = :sk AND begins_with(PK, :medicPrefix)',
            ExpressionAttributeValues: {
                ':apiKey': apiKey,
                ':sk': 'METADATA#',
                ':medicPrefix': 'MEDIC#',
            },
        });

        const response = await this.send(command);
        return response.Items && response.Items.length > 0 ? response.Items[0] : null;
    }

    async deleteMedic(id) {
        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: {
                PK: `MEDIC#${id}`,
                SK: 'METADATA#',
            },
        });

        await this.send(command);
    }
}

module.exports = MedicRepository;
