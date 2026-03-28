const { PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
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
    async getMedicByEmail(email) {
        const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: 'email = :email AND SK = :sk',
            ExpressionAttributeValues: {
                ':email': email,
                ':sk': 'METADATA#'
            }
        });

        const response = await this.send(command);
        return response.Items && response.Items.length > 0 ? response.Items[0] : null;
    }
}

module.exports = MedicRepository;
