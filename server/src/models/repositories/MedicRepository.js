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

        await this.docClient.send(command);
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

        const response = await this.docClient.send(command);
        return response.Item;
    }
}

module.exports = MedicRepository;
